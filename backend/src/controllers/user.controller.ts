import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { NotFoundError } from '../middlewares/errorHandler';
import { Role } from '@prisma/client';
import { z } from 'zod';

export const getUsers = async (req: Request, res: Response) => {
  const { role, search, page = '1', limit = '20', isActive } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { student: { OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
      ]}},
      { worker: { OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ]}},
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true,
        student: { select: { id: true, firstName: true, lastName: true, studentId: true, phone: true } },
        worker: { select: { id: true, firstName: true, lastName: true, employeeId: true, phone: true, isAvailable: true, rating: true } },
        admin: { select: { id: true, firstName: true, lastName: true, phone: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true, phone: true } },
        management: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: { users, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
  });
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true,
      student: { include: { hostel: true, room: true } },
      worker: { include: { hostel: true, assignments: { take: 5, orderBy: { createdAt: 'desc' } } } },
      admin: { include: { hostel: true } },
      supervisor: { include: { hostel: true } },
      management: true,
    },
  });

  if (!user) throw new NotFoundError('User');
  res.status(200).json({ success: true, data: user });
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Users can only update their own profile unless admin
  if (req.user!.userId !== id && req.user!.role !== Role.ADMIN && req.user!.role !== Role.MANAGEMENT) {
    throw new Error('Forbidden');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { student: true, worker: true, admin: true, supervisor: true, management: true },
  });

  if (!user) throw new NotFoundError('User');

  const { firstName, lastName, phone, avatar, hostelId, roomId, department, year, specialization, isAvailable } = req.body;

  if (user.role === Role.STUDENT && user.student) {
    await prisma.student.update({
      where: { userId: id },
      data: { firstName, lastName, phone, avatar, hostelId, roomId, department, year },
    });
  } else if (user.role === Role.WORKER && user.worker) {
    await prisma.worker.update({
      where: { userId: id },
      data: { firstName, lastName, phone, avatar, hostelId, specialization, isAvailable },
    });
  } else if (user.role === Role.ADMIN && user.admin) {
    await prisma.admin.update({
      where: { userId: id },
      data: { firstName, lastName, phone, avatar, hostelId },
    });
  } else if (user.role === Role.SUPERVISOR && user.supervisor) {
    await prisma.supervisor.update({
      where: { userId: id },
      data: { firstName, lastName, phone, avatar, hostelId },
    });
  } else if (user.role === Role.MANAGEMENT && user.management) {
    await prisma.management.update({
      where: { userId: id },
      data: { firstName, lastName, phone, avatar },
    });
  }

  res.status(200).json({ success: true, message: 'Profile updated' });
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  res.status(200).json({ success: true, message: 'User deactivated' });
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  await prisma.user.update({ where: { id }, data: { isActive } });
  res.status(200).json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}` });
};

export const getStudents = async (req: Request, res: Response) => {
  const { hostelId, search } = req.query;
  const where: Record<string, unknown> = {};
  if (hostelId) where.hostelId = hostelId;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { studentId: { contains: search, mode: 'insensitive' } },
    ];
  }
  const students = await prisma.student.findMany({
    where,
    include: { hostel: true, room: true, user: { select: { email: true, isActive: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ success: true, data: students });
};

export const getWorkersList = async (req: Request, res: Response) => {
  const { hostelId, isAvailable, search } = req.query;
  const where: Record<string, unknown> = {};
  if (hostelId) where.hostelId = hostelId;
  if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { employeeId: { contains: search, mode: 'insensitive' } },
    ];
  }
  const workers = await prisma.worker.findMany({
    where,
    include: {
      hostel: true,
      user: { select: { email: true, isActive: true } },
      _count: { select: { assignments: true } },
    },
  });
  res.status(200).json({ success: true, data: workers });
};
