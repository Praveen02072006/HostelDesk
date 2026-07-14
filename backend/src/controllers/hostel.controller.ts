import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { NotFoundError } from '../middlewares/errorHandler';

export const getHostels = async (_req: Request, res: Response) => {
  const hostels = await prisma.hostel.findMany({
    where: { isActive: true },
    include: { _count: { select: { rooms: true, students: true, complaints: true } } },
    orderBy: { name: 'asc' },
  });
  res.status(200).json({ success: true, data: hostels });
};

export const getHostelById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const hostel = await prisma.hostel.findUnique({
    where: { id },
    include: {
      rooms: { orderBy: [{ block: 'asc' }, { floor: 'asc' }] },
      _count: { select: { students: true, workers: true, complaints: true } },
    },
  });
  if (!hostel) throw new NotFoundError('Hostel');
  res.status(200).json({ success: true, data: hostel });
};

export const createHostel = async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    code: z.string().min(2).max(10).toUpperCase(),
    address: z.string().optional(),
    blocks: z.array(z.string()).default(['A', 'B', 'C', 'D']),
    floors: z.number().default(5),
  });
  const body = schema.parse(req.body);
  const hostel = await prisma.hostel.create({ data: body });
  res.status(201).json({ success: true, data: hostel });
};

export const updateHostel = async (req: Request, res: Response) => {
  const { id } = req.params;
  const hostel = await prisma.hostel.update({ where: { id }, data: req.body });
  res.status(200).json({ success: true, data: hostel });
};
