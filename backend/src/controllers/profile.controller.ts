import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// Get Current User Profile
export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }



    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: { include: { hostel: true, room: true } },
        worker: { include: { hostel: true } },
        admin: { include: { hostel: true } },
        supervisor: { include: { hostel: true } },
        management: true,
      },
    });



    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password, ...userWithoutPassword } = user;

    let profileData: any = null;
    switch (user.role) {
      case Role.STUDENT: profileData = user.student; break;
      case Role.WORKER: profileData = user.worker; break;
      case Role.ADMIN: profileData = user.admin; break;
      case Role.SUPERVISOR: profileData = user.supervisor; break;
      case Role.MANAGEMENT: profileData = user.management; break;
    }

    res.json({
      success: true,
      data: {
        ...userWithoutPassword,
        profile: profileData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update Profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    
    if (!userId) throw new AppError('Unauthorized', 401);

    const { 
      phone, avatar, firstName, lastName, gender, 
      personalEmail, guardianName, guardianRelation, guardianPhone,
      emailNotifications, complaintNotifications,
      ...otherFields 
    } = req.body;

    // 2. Reject request if attempting to modify restricted fields
    if (role === Role.STUDENT) {
    const restrictedFields = [
        'firstName', 'lastName',
        'studentId', 'email', 'collegeEmail', 'department', 'year', 'academicYear', 
        'hostelId', 'roomId', 'hostel', 'room', 'hostelName', 'block', 'floor', 
        'roomNumber', 'roomType'
      ];

      const attemptedRestrictedFields = Object.keys(req.body).filter(key => 
        restrictedFields.includes(key) && req.body[key] !== undefined
      );

      if (attemptedRestrictedFields.length > 0) {
        throw new AppError(`Forbidden: Modification of restricted field(s) '${attemptedRestrictedFields.join(', ')}' is not allowed.`, 403);
      }
    }

    let updatedProfile;

    // 1. Update User level preferences if provided
    if (emailNotifications !== undefined || complaintNotifications !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailNotifications: emailNotifications !== undefined ? emailNotifications : undefined,
          complaintNotifications: complaintNotifications !== undefined ? complaintNotifications : undefined,
        },
      });
    }

    switch (role) {
      case Role.STUDENT:
        const studentUpdateData: any = { 
          phone, avatar, gender, 
          personalEmail, guardianName, guardianRelation, guardianPhone 
        };
        Object.keys(studentUpdateData).forEach(key => studentUpdateData[key] === undefined && delete studentUpdateData[key]);
        updatedProfile = await prisma.student.update({
          where: { userId },
          data: studentUpdateData,
          include: { hostel: true, room: true },
        });

        // Sync emergency contact to .context/STUDENT_DATA.md
        if (guardianName !== undefined || guardianRelation !== undefined || guardianPhone !== undefined) {
          try {
            await syncEmergencyContactToContextFile(updatedProfile.studentId, {
              guardianName: updatedProfile.guardianName,
              guardianRelation: updatedProfile.guardianRelation,
              guardianPhone: updatedProfile.guardianPhone,
            });
          } catch (syncErr) {
            console.warn('[SYNC] Failed to update .context/STUDENT_DATA.md:', syncErr);
          }
        }
        break;
        
      case Role.WORKER:
      case Role.ADMIN:
      case Role.SUPERVISOR:
      case Role.MANAGEMENT:
        const otherUpdateData: any = { phone, avatar };
        Object.keys(otherUpdateData).forEach(key => otherUpdateData[key] === undefined && delete otherUpdateData[key]);
        
        if (role === Role.WORKER) updatedProfile = await prisma.worker.update({ where: { userId }, data: otherUpdateData });
        else if (role === Role.ADMIN) updatedProfile = await prisma.admin.update({ where: { userId }, data: otherUpdateData });
        else if (role === Role.SUPERVISOR) updatedProfile = await prisma.supervisor.update({ where: { userId }, data: otherUpdateData });
        else if (role === Role.MANAGEMENT) updatedProfile = await prisma.management.update({ where: { userId }, data: otherUpdateData });
        break;

      default:
        throw new AppError('Invalid role for profile update', 400);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// Change Password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!currentPassword || !newPassword) throw new AppError('Current and new password are required', 400);

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { student: true }
    });
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Incorrect current password', 401);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, lastPasswordChange: new Date() },
    });

    if (user.student) {
      try {
        await syncPasswordToContextFile(user.student.studentId, newPassword);
      } catch (syncErr) {
        console.warn('[SYNC] Failed to update password in .context/STUDENT_DATA.md:', syncErr);
      }
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get Active Sessions
export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    const sessions = await prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

// Revoke specific session
export const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;

    if (!userId) throw new AppError('Unauthorized', 401);

    const session = await prisma.refreshToken.findUnique({ where: { id: sessionId } });
    
    if (!session || session.userId !== userId) {
      throw new AppError('Session not found', 404);
    }

    await prisma.refreshToken.delete({ where: { id: sessionId } });

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ── Helper: Sync emergency contact data to .context/STUDENT_DATA.md ──
async function syncEmergencyContactToContextFile(
  studentId: string,
  contact: { guardianName: string | null; guardianRelation: string | null; guardianPhone: string | null }
) {
  const contextFilePath = path.resolve(__dirname, '..', '..', '..', '.context', 'STUDENT_DATA.md');

  if (!fs.existsSync(contextFilePath)) {
    console.warn('[SYNC] .context/STUDENT_DATA.md not found at', contextFilePath);
    return;
  }

  let content = fs.readFileSync(contextFilePath, 'utf-8');

  const emergencySectionHeader = '## Emergency Contacts';
  const contactLine = `| ${studentId} | ${contact.guardianName || '-'} | ${contact.guardianRelation || '-'} | ${contact.guardianPhone || '-'} |`;

  if (!content.includes(emergencySectionHeader)) {
    // Append a new Emergency Contacts section at the end
    content += `\n------------------------------------------------------------------------\n\n${emergencySectionHeader}\n\n| Student ID | Guardian Name | Relationship | Guardian Phone |\n|------------|---------------|--------------|----------------|\n${contactLine}\n`;
  } else {
    // Section already exists — update or insert this student's row
    const studentRowRegex = new RegExp(`^\\|\\s*${studentId}\\s*\\|.*$`, 'm');
    if (studentRowRegex.test(content)) {
      // Replace existing row
      content = content.replace(studentRowRegex, contactLine);
    } else {
      // Insert new row after the table header divider
      const headerDividerRegex = /(\|[-\s|]+\|)\n/;
      const match = content.substring(content.indexOf(emergencySectionHeader)).match(headerDividerRegex);
      if (match) {
        const insertPos = content.indexOf(emergencySectionHeader) + (content.substring(content.indexOf(emergencySectionHeader)).indexOf(match[0]) + match[0].length);
        content = content.substring(0, insertPos) + contactLine + '\n' + content.substring(insertPos);
      }
    }
  }

  fs.writeFileSync(contextFilePath, content, 'utf-8');
  console.log(`[SYNC] Emergency contact for ${studentId} synced to STUDENT_DATA.md`);
}

// ── Helper: Sync password data to .context/STUDENT_DATA.md ──
async function syncPasswordToContextFile(
  studentId: string,
  newPassword: string
) {
  const contextFilePath = path.resolve(__dirname, '..', '..', '..', '.context', 'STUDENT_DATA.md');

  if (!fs.existsSync(contextFilePath)) {
    console.warn('[SYNC] .context/STUDENT_DATA.md not found at', contextFilePath);
    return;
  }

  let content = fs.readFileSync(contextFilePath, 'utf-8');

  const passwordSectionHeader = '## Updated Passwords';
  const passwordLine = `| ${studentId} | \`${newPassword}\` |`;

  if (!content.includes(passwordSectionHeader)) {
    // Append a new Updated Passwords section at the end
    content += `\n------------------------------------------------------------------------\n\n${passwordSectionHeader}\n\n| Student ID | Current Password |\n|------------|------------------|\n${passwordLine}\n`;
  } else {
    // Section already exists — update or insert this student's row
    const studentRowRegex = new RegExp(`^\\|\\s*${studentId}\\s*\\|.*$`, 'm');
    if (studentRowRegex.test(content)) {
      // Replace existing row
      content = content.replace(studentRowRegex, passwordLine);
    } else {
      // Insert new row after the table header divider
      const headerDividerRegex = /(\|[-\s|]+\|)\n/;
      // Since there could be multiple tables, we search *after* our section header
      const afterHeader = content.substring(content.indexOf(passwordSectionHeader));
      const match = afterHeader.match(headerDividerRegex);
      if (match) {
        const insertPos = content.indexOf(passwordSectionHeader) + afterHeader.indexOf(match[0]) + match[0].length;
        content = content.substring(0, insertPos) + passwordLine + '\n' + content.substring(insertPos);
      }
    }
  }

  fs.writeFileSync(contextFilePath, content, 'utf-8');
  console.log(`[SYNC] Password for ${studentId} synced to STUDENT_DATA.md`);
}
