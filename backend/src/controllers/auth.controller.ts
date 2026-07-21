import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { hashPassword, comparePassword, generateRandomToken } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendEmail, emailTemplates } from '../config/email';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@prisma/client';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.nativeEnum(Role),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  studentId: z.string().optional(),
  employeeId: z.string().optional(),
  hostelId: z.string().optional(),
  department: z.string().optional(),
  year: z.number().min(1).max(6).optional(),
  specialization: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export const register = async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);

  // Check if email exists
  const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
  if (existingUser) throw new ConflictError('Email already registered');

  // Check unique IDs
  if (body.studentId) {
    const existing = await prisma.student.findUnique({ where: { studentId: body.studentId } });
    if (existing) throw new ConflictError('Student ID already registered');
  }
  if (body.employeeId) {
    const existing = await prisma.worker.findUnique({ where: { employeeId: body.employeeId } });
    if (existing) throw new ConflictError('Employee ID already registered');
  }

  const hashedPassword = await hashPassword(body.password);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
      role: body.role,
      ...(body.role === Role.STUDENT && {
        student: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            studentId: body.studentId || `STU${Date.now()}`,
            phone: body.phone,
            hostelId: body.hostelId,
            department: body.department,
            year: body.year,
          },
        },
      }),
      ...(body.role === Role.WORKER && {
        worker: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            employeeId: body.employeeId || `EMP${Date.now()}`,
            phone: body.phone,
            hostelId: body.hostelId,
            specialization: body.specialization || [],
          },
        },
      }),
      ...(body.role === Role.ADMIN && {
        admin: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            hostelId: body.hostelId,
          },
        },
      }),
      ...(body.role === Role.SUPERVISOR && {
        supervisor: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            hostelId: body.hostelId,
          },
        },
      }),
      ...(body.role === Role.MANAGEMENT && {
        management: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
          },
        },
      }),
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Fire-and-forget welcome email (don't block response)
  sendEmail({
    to: body.email,
    ...emailTemplates.welcome(`${body.firstName} ${body.lastName}`, body.role),
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: user,
  });
};

export const login = async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: body.email.trim() },
        { student: { studentId: body.email.trim() } }
      ]
    },
    include: {
      student: true,
      worker: true,
      admin: true,
      supervisor: true,
      management: true,
    },
  });

  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (!user.isActive) throw new UnauthorizedError('Account is inactive. Please contact admin.');

  const isPasswordValid = await comparePassword(body.password, user.password);
  if (!isPasswordValid) throw new UnauthorizedError('Invalid email or password');

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  const tokenId = uuidv4();
  const refreshTokenStr = generateRefreshToken({ userId: user.id, tokenId });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (body.rememberMe ? 30 : 7));

  // Parallelize token storage and last login update
  await Promise.all([
    prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: refreshTokenStr,
        userId: user.id,
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  // Get profile data
  const profile = user.student || user.worker || user.admin || user.supervisor || user.management;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
      },
      accessToken,
      refreshToken: refreshTokenStr,
    },
  });
};

export const logout = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(200).json({ success: true, message: 'Logged out' });
    return;
  }

  // Delete all refresh tokens for this user (logout from all devices)
  await prisma.refreshToken.deleteMany({
    where: { userId: req.user!.userId },
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) throw new UnauthorizedError('Refresh token required');

  const payload = verifyRefreshToken(token);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
    include: { user: true },
  });

  if (!storedToken || storedToken.token !== token) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: payload.tokenId } });
    throw new UnauthorizedError('Refresh token expired');
  }

  if (!storedToken.user.isActive) {
    throw new UnauthorizedError('Account is inactive');
  }

  const accessToken = generateAccessToken({
    userId: storedToken.user.id,
    role: storedToken.user.role,
    email: storedToken.user.email,
  });

  res.status(200).json({
    success: true,
    data: { accessToken },
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success (prevent email enumeration)
  if (!user) {
    res.status(200).json({ success: true, message: 'If this email exists, a reset link has been sent' });
    return;
  }

  const resetToken = generateRandomToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const profile = await prisma.student.findUnique({ where: { userId: user.id } })
    || await prisma.worker.findUnique({ where: { userId: user.id } })
    || await prisma.admin.findUnique({ where: { userId: user.id } });
  const name = profile ? `${(profile as { firstName: string }).firstName}` : 'User';

  // Fire-and-forget reset email (don't block response)
  sendEmail({
    to: user.email,
    ...emailTemplates.passwordReset(name, resetUrl),
  });

  res.status(200).json({ success: true, message: 'If this email exists, a reset link has been sent' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string(),
    password: z.string()
      .min(8)
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[0-9]/, 'Must contain number'),
  });

  const { token, password } = schema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  res.status(200).json({ success: true, message: 'Password reset successful' });
};

export const getProfile = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      student: { include: { hostel: true, room: true } },
      worker: { include: { hostel: true } },
      admin: { include: { hostel: true } },
      supervisor: { include: { hostel: true } },
      management: true,
    },
  });

  if (!user) throw new NotFoundError('User');

  const { password: _, resetToken: __, resetTokenExpiry: ___, ...safeUser } = user;

  res.status(200).json({ success: true, data: safeUser });
};

export const changePassword = async (req: Request, res: Response) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  });

  const { currentPassword, newPassword } = schema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new NotFoundError('User');

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) throw new UnauthorizedError('Current password is incorrect');

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  res.status(200).json({ success: true, message: 'Password changed successfully' });
};
