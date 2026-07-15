import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { NotFoundError, AppError } from '../middlewares/errorHandler';
import { JobStatus, ComplaintStatus } from '@prisma/client';
import { z } from 'zod';
import { emitNotification } from '../socket';

export const getWorkerJobs = async (req: Request, res: Response) => {
  const worker = await prisma.worker.findUnique({ where: { userId: req.user!.userId } });
  if (!worker) throw new NotFoundError('Worker profile');

  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { workerId: worker.id };
  if (status) where.status = status;

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        complaint: {
          include: {
            category: true,
            subcategory: true,
            hostel: true,
            room: true,
            images: true,
            student: { select: { firstName: true, lastName: true, studentId: true } },
          },
        },
      },
    }),
    prisma.assignment.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: { assignments, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
  });
};

export const acceptJob = async (req: Request, res: Response) => {
  const { assignmentId } = req.params;

  const worker = await prisma.worker.findUnique({ where: { userId: req.user!.userId } });
  if (!worker) throw new NotFoundError('Worker profile');

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, workerId: worker.id },
    include: { complaint: true },
  });
  if (!assignment) throw new NotFoundError('Assignment');

  if (assignment.status !== JobStatus.PENDING) {
    throw new AppError('Job is not in pending status', 400);
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: JobStatus.ACCEPTED, acceptedAt: new Date() },
  });

  await prisma.complaint.update({
    where: { id: assignment.complaintId },
    data: {
      status: ComplaintStatus.ACCEPTED,
      statusHistory: {
        create: {
          fromStatus: ComplaintStatus.ASSIGNED,
          toStatus: ComplaintStatus.ACCEPTED,
          changedBy: req.user!.userId,
          note: 'Job accepted by worker',
        },
      },
    },
  });

  res.status(200).json({ success: true, message: 'Job accepted' });
};

export const rejectJob = async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);

  const worker = await prisma.worker.findUnique({ where: { userId: req.user!.userId } });
  if (!worker) throw new NotFoundError('Worker profile');

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, workerId: worker.id },
    include: { complaint: true },
  });
  if (!assignment) throw new NotFoundError('Assignment');

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: JobStatus.REJECTED, rejectedAt: new Date(), rejectReason: reason },
  });

  // Reset complaint to verified (needs reassignment)
  await prisma.complaint.update({
    where: { id: assignment.complaintId },
    data: {
      status: ComplaintStatus.VERIFIED,
      statusHistory: {
        create: {
          fromStatus: ComplaintStatus.ASSIGNED,
          toStatus: ComplaintStatus.VERIFIED,
          changedBy: req.user!.userId,
          note: `Rejected by worker: ${reason}`,
        },
      },
    },
  });

  res.status(200).json({ success: true, message: 'Job rejected' });
};

export const markInProgress = async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const { images } = z.object({
    images: z.array(z.object({ url: z.string(), publicId: z.string() })).optional(),
  }).parse(req.body);

  const worker = await prisma.worker.findUnique({ where: { userId: req.user!.userId } });
  if (!worker) throw new NotFoundError('Worker profile');

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, workerId: worker.id },
    include: { complaint: true },
  });
  if (!assignment) throw new NotFoundError('Assignment');

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: JobStatus.IN_PROGRESS, startedAt: new Date() },
  });

  // Add before-repair images
  if (images?.length) {
    await prisma.complaintImage.createMany({
      data: images.map(img => ({
        complaintId: assignment.complaintId,
        url: img.url,
        publicId: img.publicId,
        type: 'before_repair',
        uploadedBy: req.user!.userId,
      })),
    });
  }

  await prisma.complaint.update({
    where: { id: assignment.complaintId },
    data: {
      status: ComplaintStatus.IN_PROGRESS,
      statusHistory: {
        create: {
          fromStatus: ComplaintStatus.ACCEPTED,
          toStatus: ComplaintStatus.IN_PROGRESS,
          changedBy: req.user!.userId,
          note: 'Work started',
        },
      },
    },
  });

  res.status(200).json({ success: true, message: 'Job marked as in progress' });
};

export const markCompleted = async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const { images, notes, actualCost } = z.object({
    images: z.array(z.object({ url: z.string(), publicId: z.string() })).optional(),
    notes: z.string().optional(),
    actualCost: z.number().optional(),
  }).parse(req.body);

  const worker = await prisma.worker.findUnique({ where: { userId: req.user!.userId } });
  if (!worker) throw new NotFoundError('Worker profile');

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, workerId: worker.id },
    include: { complaint: { include: { student: { include: { user: true } } } } },
  });
  if (!assignment) throw new NotFoundError('Assignment');

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: JobStatus.COMPLETED, completedAt: new Date() },
  });

  // Add after-repair images
  if (images?.length) {
    await prisma.complaintImage.createMany({
      data: images.map(img => ({
        complaintId: assignment.complaintId,
        url: img.url,
        publicId: img.publicId,
        type: 'after_repair',
        uploadedBy: req.user!.userId,
      })),
    });
  }

  await prisma.complaint.update({
    where: { id: assignment.complaintId },
    data: {
      status: ComplaintStatus.COMPLETED,
      completedAt: new Date(),
      actualCost,
      statusHistory: {
        create: {
          fromStatus: ComplaintStatus.IN_PROGRESS,
          toStatus: ComplaintStatus.COMPLETED,
          changedBy: req.user!.userId,
          note: notes || 'Work completed',
        },
      },
    },
  });

  // Update worker stats
  await prisma.worker.update({
    where: { id: worker.id },
    data: { completedJobs: { increment: 1 }, totalJobs: { increment: 1 } },
  });

  // Notify student
  const student = assignment.complaint.student;
  await prisma.notification.create({
    data: {
      userId: student.userId,
      title: '🔧 Work Completed - Verification Needed',
      message: `The worker has completed your complaint #${assignment.complaint.ticketNumber}. Please verify the work.`,
      type: 'COMPLAINT_COMPLETED',
      complaintId: assignment.complaintId,
    },
  });
  emitNotification(student.userId, {
    title: '🔧 Work Completed - Verification Needed',
    message: `Complaint #${assignment.complaint.ticketNumber} work done. Please verify.`,
    type: 'COMPLAINT_COMPLETED',
    complaintId: assignment.complaintId,
  });

  res.status(200).json({ success: true, message: 'Job marked as completed' });
};

export const getWorkerPerformance = async (req: Request, res: Response) => {
  const { workerId } = req.query;
  
  let targetWorkerId: string;
  
  if (workerId && ['ADMIN', 'SUPERVISOR', 'MANAGEMENT'].includes(req.user!.role)) {
    targetWorkerId = workerId as string;
  } else {
    const worker = await prisma.worker.findUnique({ where: { userId: req.user!.userId } });
    if (!worker) throw new NotFoundError('Worker profile');
    targetWorkerId = worker.id;
  }

  const [worker, completedJobs, ratings, avgResolutionTime] = await Promise.all([
    prisma.worker.findUnique({
      where: { id: targetWorkerId },
      select: { firstName: true, lastName: true, employeeId: true, rating: true, totalJobs: true, completedJobs: true },
    }),
    prisma.assignment.count({
      where: { workerId: targetWorkerId, status: 'COMPLETED' },
    }),
    prisma.feedback.aggregate({
      where: { workerId: targetWorkerId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.assignment.findMany({
      where: { workerId: targetWorkerId, status: 'COMPLETED', startedAt: { not: null }, completedAt: { not: null } },
      select: { startedAt: true, completedAt: true },
    }),
  ]);

  const avgTime = avgResolutionTime.reduce((acc, a) => {
    if (a.startedAt && a.completedAt) {
      return acc + (a.completedAt.getTime() - a.startedAt.getTime());
    }
    return acc;
  }, 0) / (avgResolutionTime.length || 1);

  res.status(200).json({
    success: true,
    data: {
      worker,
      completedJobs,
      averageRating: ratings._avg.rating || 0,
      totalRatings: ratings._count.rating,
      averageResolutionTimeMs: avgTime,
    },
  });
};

export const getWorkerStats = async (req: Request, res: Response) => {
  const worker = await prisma.worker.findUnique({ where: { userId: req.user!.userId } });
  if (!worker) throw new NotFoundError('Worker profile');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayJobs, pending, inProgress, completed, totalRating] = await Promise.all([
    prisma.assignment.count({
      where: { workerId: worker.id, createdAt: { gte: today } },
    }),
    prisma.assignment.count({ where: { workerId: worker.id, status: 'PENDING' } }),
    prisma.assignment.count({ where: { workerId: worker.id, status: 'IN_PROGRESS' } }),
    prisma.assignment.count({ where: { workerId: worker.id, status: 'COMPLETED' } }),
    prisma.feedback.aggregate({
      where: { workerId: worker.id },
      _avg: { rating: true },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      todayJobs,
      pending,
      inProgress,
      completed,
      averageRating: totalRating._avg.rating || 0,
      completionRate: worker.totalJobs > 0 ? (worker.completedJobs / worker.totalJobs) * 100 : 0,
    },
  });
};
