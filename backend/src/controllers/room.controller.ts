import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { NotFoundError } from '../middlewares/errorHandler';

import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';

export const getRooms = async (req: Request, res: Response) => {
  const { hostelId, floor, block, search } = req.query;
  const where: Record<string, unknown> = { isActive: true };
  if (hostelId) where.hostelId = hostelId;
  if (floor) where.floor = parseInt(floor as string);
  if (block) where.block = block;
  if (search) where.roomNumber = { contains: search, mode: 'insensitive' };

  const rooms = await prisma.room.findMany({
    where,
    include: {
      hostel: { select: { name: true, code: true } },
      _count: { select: { students: true, complaints: true } },
    },
    orderBy: [{ block: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
  });
  res.status(200).json({ success: true, data: rooms });
};

export const getRoomById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      hostel: true,
      students: { include: { user: { select: { email: true } } } },
      complaints: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { category: true },
      },
    },
  });
  if (!room) throw new NotFoundError('Room');
  res.status(200).json({ success: true, data: room });
};

export const createRoom = async (req: Request, res: Response) => {
  const schema = z.object({
    hostelId: z.string().uuid(),
    roomNumber: z.string(),
    floor: z.number(),
    block: z.string(),
    capacity: z.number().default(4),
  });
  const body = schema.parse(req.body);
  const room = await prisma.room.create({ data: { ...body } });
  res.status(201).json({ success: true, data: room });
};

export const updateRoom = async (req: Request, res: Response) => {
  const { id } = req.params;
  const room = await prisma.room.update({ where: { id }, data: req.body });
  res.status(200).json({ success: true, data: room });
};
