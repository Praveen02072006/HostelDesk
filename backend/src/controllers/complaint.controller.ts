import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, AppError } from '../middlewares/errorHandler';
import { ComplaintStatus, Priority, Role } from '@prisma/client';
import { emitNotification } from '../socket';
import { sendEmail, emailTemplates } from '../config/email';
import { v4 as uuidv4 } from 'uuid';

const generateTicketNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `HD${year}${month}${random}`;
};

const createComplaintSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  floor: z.number().optional(),
  block: z.string().optional(),
  roomNumber: z.string().optional(),
  priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
  images: z.array(z.object({
    url: z.string().url(),
    publicId: z.string(),
    caption: z.string().optional(),
  })).optional(),
});

export const createComplaint = async (req: Request, res: Response) => {
  const body = createComplaintSchema.parse(req.body);

  const student = await prisma.student.findUnique({
    where: { userId: req.user!.userId },
  });
  if (!student) throw new NotFoundError('Student profile');
  if (!student.hostelId) {
    return res.status(400).json({ success: false, message: 'You must be assigned to a hostel before raising a complaint.' });
  }

  // Check for recurring complaints
  const recentSimilar = await prisma.complaint.findFirst({
    where: {
      studentId: student.id,
      categoryId: body.categoryId,
      roomId: body.roomId,
      status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.ARCHIVED, ComplaintStatus.CANCELLED] },
    },
  });

  const isRecurring = !!recentSimilar;

  const ticketNumber = generateTicketNumber();

  // Calculate SLA deadline based on priority
  const slaHours = {
    [Priority.CRITICAL]: 4,
    [Priority.HIGH]: 24,
    [Priority.MEDIUM]: 72,
    [Priority.LOW]: 168,
  };
  const slaDeadline = new Date(Date.now() + slaHours[body.priority] * 60 * 60 * 1000);

  const complaint = await prisma.complaint.create({
    data: {
      ticketNumber,
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      studentId: student.id,
      hostelId: student.hostelId!, // Always use the student's own hostelId (server-side)
      roomId: body.roomId,
      floor: body.floor,
      block: body.block,
      roomNumber: body.roomNumber,
      priority: body.priority,
      isRecurring,
      slaDeadline,
      images: {
        create: body.images?.map(img => ({
          url: img.url,
          publicId: img.publicId,
          type: 'complaint',
          caption: img.caption,
          uploadedBy: req.user!.userId,
        })) || [],
      },
      statusHistory: {
        create: {
          toStatus: ComplaintStatus.RAISED,
          changedBy: req.user!.userId,
          note: 'Complaint raised by student',
        },
      },
    },
    include: {
      category: true,
      subcategory: true,
      images: true,
      room: true,
      hostel: true,
    },
  });

  // Create notification for student
  await prisma.notification.create({
    data: {
      userId: req.user!.userId,
      title: 'Complaint Submitted',
      message: `Your complaint #${ticketNumber} has been submitted successfully`,
      type: 'COMPLAINT_SUBMITTED',
      complaintId: complaint.id,
    },
  });

  // Notify admins about critical complaints
  if (body.priority === Priority.CRITICAL && student.hostelId) {
    const admins = await prisma.admin.findMany({
      where: { hostelId: student.hostelId },
      include: { user: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.userId,
          title: '🚨 Critical Complaint Raised',
          message: `Critical complaint #${ticketNumber} raised: ${body.title}`,
          type: 'HIGH_PRIORITY_ALERT',
          complaintId: complaint.id,
        },
      });
      emitNotification(admin.userId, {
        title: '🚨 Critical Complaint',
        message: `Critical complaint #${ticketNumber} requires immediate attention`,
        type: 'HIGH_PRIORITY_ALERT',
        complaintId: complaint.id,
      });
    }
  }

  // Send email confirmation
  await sendEmail({
    to: req.user!.email,
    ...emailTemplates.complaintSubmitted(
      `${student.firstName}`,
      ticketNumber,
      body.title
    ),
  });

  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    data: complaint,
  });
};

export const getComplaints = async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '20',
    status,
    priority,
    categoryId,
    hostelId,
    search,
    workerId,
    floor,
    block,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (categoryId) where.categoryId = categoryId;
  if (hostelId) where.hostelId = hostelId;
  if (floor) where.floor = parseInt(floor as string);
  if (block) where.block = block;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate as string);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate as string);
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { ticketNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Worker can only see assigned complaints
  if (req.user!.role === Role.WORKER) {
    const worker = await prisma.worker.findUnique({ where: { userId: req.user!.userId } });
    if (worker) {
      where.assignments = { some: { workerId: worker.id } };
    }
  }

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        category: true,
        subcategory: true,
        student: { select: { firstName: true, lastName: true, studentId: true } },
        hostel: { select: { name: true, code: true } },
        room: { select: { roomNumber: true, floor: true, block: true } },
        images: true,
        assignments: {
          include: {
            worker: { select: { firstName: true, lastName: true, employeeId: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { statusHistory: true } },
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      complaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
};

export const getMyComplaints = async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
  if (!student) throw new NotFoundError('Student profile');

  const { status, page = '1', limit = '10' } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { studentId: student.id };
  if (status) where.status = status;

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        subcategory: true,
        images: true,
        hostel: { select: { name: true } },
        room: { select: { roomNumber: true, floor: true, block: true } },
        assignments: {
          include: { worker: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        feedback: true,
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      complaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
};

export const getComplaintById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const complaint = await prisma.complaint.findFirst({
    where: { OR: [{ id }, { ticketNumber: id }] },
    include: {
      category: true,
      subcategory: true,
      student: {
        include: { user: { select: { email: true } } },
      },
      hostel: true,
      room: true,
      images: true,
      assignments: {
        include: {
          worker: {
            include: { user: { select: { email: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      feedback: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      notifications: { orderBy: { createdAt: 'desc' }, take: 5 },
      inventoryUsage: { include: { item: true } },
    },
  });

  if (!complaint) throw new NotFoundError('Complaint');

  // Students can only see their own complaints
  if (req.user!.role === Role.STUDENT) {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (complaint.studentId !== student?.id) {
      throw new ForbiddenError('You can only view your own complaints');
    }
  }

  res.status(200).json({ success: true, data: complaint });
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schema = z.object({
    status: z.nativeEnum(ComplaintStatus),
    note: z.string().optional(),
  });

  const { status, note } = schema.parse(req.body);

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new NotFoundError('Complaint');

  // Validate status transitions
  const validTransitions: Partial<Record<ComplaintStatus, ComplaintStatus[]>> = {
    [ComplaintStatus.RAISED]: [ComplaintStatus.VERIFIED, ComplaintStatus.CANCELLED],
    [ComplaintStatus.VERIFIED]: [ComplaintStatus.ASSIGNED],
    [ComplaintStatus.ASSIGNED]: [ComplaintStatus.ACCEPTED],
    [ComplaintStatus.ACCEPTED]: [ComplaintStatus.IN_PROGRESS],
    [ComplaintStatus.IN_PROGRESS]: [ComplaintStatus.COMPLETED],
    [ComplaintStatus.COMPLETED]: [ComplaintStatus.CLOSED, ComplaintStatus.RAISED],
    [ComplaintStatus.CLOSED]: [ComplaintStatus.ARCHIVED],
  };

  const currentTransitions = validTransitions[complaint.status];
  if (currentTransitions && !currentTransitions.includes(status)) {
    throw new AppError(`Cannot transition from ${complaint.status} to ${status}`, 400);
  }

  const updateData: Record<string, unknown> = { status };
  if (status === ComplaintStatus.COMPLETED) updateData.completedAt = new Date();
  if (status === ComplaintStatus.CLOSED) updateData.closedAt = new Date();
  if (status === ComplaintStatus.ARCHIVED) updateData.archivedAt = new Date();

  await prisma.complaint.update({
    where: { id },
    data: {
      ...updateData,
      statusHistory: {
        create: {
          fromStatus: complaint.status,
          toStatus: status,
          changedBy: req.user!.userId,
          note,
        },
      },
    },
  });

  // Notify relevant users
  const notifData = {
    title: `Complaint Status Updated`,
    message: `Complaint #${complaint.ticketNumber} status changed to ${status}`,
    type: 'COMPLAINT_UPDATED' as const,
    complaintId: complaint.id,
  };

  const student = await prisma.student.findUnique({ where: { id: complaint.studentId } });
  if (student) {
    await prisma.notification.create({
      data: { userId: student.userId, ...notifData, type: 'COMPLAINT_UPDATED' },
    });
    emitNotification(student.userId, notifData);
  }

  const updatedComplaint = await prisma.complaint.findUnique({
    where: { id },
    include: { statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });

  res.status(200).json({ success: true, data: updatedComplaint });
};

export const assignWorker = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schema = z.object({
    workerId: z.string().uuid(),
    deadline: z.string().datetime().optional(),
    notes: z.string().optional(),
  });

  const body = schema.parse(req.body);

  const [complaint, worker] = await Promise.all([
    prisma.complaint.findUnique({
      where: { id },
      include: { student: { include: { user: true } } },
    }),
    prisma.worker.findUnique({ where: { id: body.workerId } }),
  ]);

  if (!complaint) throw new NotFoundError('Complaint');
  if (!worker) throw new NotFoundError('Worker');

  // Check worker availability
  const activeAssignments = await prisma.assignment.count({
    where: {
      workerId: body.workerId,
      status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
    },
  });

  if (activeAssignments >= 10) {
    throw new AppError('Worker has too many active assignments', 400);
  }

  const assignment = await prisma.assignment.create({
    data: {
      complaintId: id,
      workerId: body.workerId,
      assignedBy: req.user!.userId,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      notes: body.notes,
    },
    include: { worker: { include: { user: true } } },
  });

  // Update complaint status
  await prisma.complaint.update({
    where: { id },
    data: {
      status: ComplaintStatus.ASSIGNED,
      statusHistory: {
        create: {
          fromStatus: complaint.status,
          toStatus: ComplaintStatus.ASSIGNED,
          changedBy: req.user!.userId,
          note: `Assigned to worker ${worker.firstName} ${worker.lastName}`,
        },
      },
    },
  });

  // Notify worker
  await prisma.notification.create({
    data: {
      userId: worker.userId,
      title: 'New Job Assigned',
      message: `You have been assigned complaint #${complaint.ticketNumber}`,
      type: 'NEW_ASSIGNMENT',
      complaintId: id,
    },
  });
  emitNotification(worker.userId, {
    title: 'New Job Assigned',
    message: `Complaint #${complaint.ticketNumber} assigned to you`,
    type: 'NEW_ASSIGNMENT',
    complaintId: id,
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: complaint.student.userId,
      title: 'Worker Assigned',
      message: `${worker.firstName} ${worker.lastName} has been assigned to your complaint #${complaint.ticketNumber}`,
      type: 'WORKER_ASSIGNED',
      complaintId: id,
    },
  });

  // Send email to student
  await sendEmail({
    to: complaint.student.user.email,
    ...emailTemplates.workerAssigned(
      complaint.student.firstName,
      complaint.ticketNumber,
      `${worker.firstName} ${worker.lastName}`
    ),
  });

  res.status(200).json({ success: true, data: assignment });
};

export const cancelComplaint = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);

  const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
  const complaint = await prisma.complaint.findUnique({ where: { id } });

  if (!complaint) throw new NotFoundError('Complaint');
  if (complaint.studentId !== student?.id) throw new ForbiddenError();

  if (complaint.status !== ComplaintStatus.RAISED) {
    throw new AppError('Only unassigned complaints can be cancelled', 400);
  }

  await prisma.complaint.update({
    where: { id },
    data: {
      status: ComplaintStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: reason,
      statusHistory: {
        create: {
          fromStatus: ComplaintStatus.RAISED,
          toStatus: ComplaintStatus.CANCELLED,
          changedBy: req.user!.userId,
          note: reason,
        },
      },
    },
  });

  res.status(200).json({ success: true, message: 'Complaint cancelled' });
};

export const addComplaintNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { note, isAdmin } = z.object({
    note: z.string().min(1),
    isAdmin: z.boolean().optional().default(false),
  }).parse(req.body);

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new NotFoundError('Complaint');

  await prisma.complaint.update({
    where: { id },
    data: isAdmin ? { adminNotes: note } : { notes: note },
  });

  res.status(200).json({ success: true, message: 'Note added' });
};

export const getComplaintTimeline = async (req: Request, res: Response) => {
  const { id } = req.params;

  const history = await prisma.statusHistory.findMany({
    where: { complaintId: id },
    orderBy: { createdAt: 'asc' },
  });

  res.status(200).json({ success: true, data: history });
};

export const escalateComplaint = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = z.object({ reason: z.string().min(10) }).parse(req.body);

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new NotFoundError('Complaint');

  const newPriority = complaint.priority === Priority.LOW ? Priority.MEDIUM
    : complaint.priority === Priority.MEDIUM ? Priority.HIGH
    : Priority.CRITICAL;

  await prisma.complaint.update({
    where: { id },
    data: {
      priority: newPriority,
      adminNotes: `ESCALATED: ${reason}`,
      statusHistory: {
        create: {
          fromStatus: complaint.status,
          toStatus: complaint.status,
          changedBy: req.user!.userId,
          note: `Escalated - Priority changed to ${newPriority}. Reason: ${reason}`,
        },
      },
    },
  });

  res.status(200).json({ success: true, message: `Complaint escalated to ${newPriority} priority` });
};

export const updateComplaintPriority = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { priority } = z.object({ priority: z.nativeEnum(Priority) }).parse(req.body);

  await prisma.complaint.update({ where: { id }, data: { priority } });
  res.status(200).json({ success: true, message: 'Priority updated' });
};

export const getComplaintStats = async (req: Request, res: Response) => {
  const { hostelId } = req.query;
  const where = hostelId ? { hostelId: hostelId as string } : {};

  const [total, byStatus, byPriority, slaBreached, today] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    }),
    prisma.complaint.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    }),
    prisma.complaint.count({ where: { ...where, slaBreached: true } }),
    prisma.complaint.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: { total, byStatus, byPriority, slaBreached, today },
  });
};

export const bulkAssign = async (req: Request, res: Response) => {
  const schema = z.object({
    complaintIds: z.array(z.string().uuid()),
    workerId: z.string().uuid(),
  });
  const { complaintIds, workerId } = schema.parse(req.body);

  const assignments = await Promise.all(
    complaintIds.map(complaintId =>
      prisma.assignment.create({
        data: { complaintId, workerId, assignedBy: req.user!.userId },
      })
    )
  );

  res.status(201).json({ success: true, data: assignments });
};
