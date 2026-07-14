import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { InventoryCategory } from '@prisma/client';

export const getInventory = async (req: Request, res: Response) => {
  const { hostelId, category } = req.query;
  const where: Record<string, unknown> = {};
  if (hostelId) where.hostelId = hostelId;
  if (category) where.category = category;

  const items = await prisma.inventoryItem.findMany({
    where,
    include: { _count: { select: { usages: true } } },
    orderBy: { name: 'asc' },
  });
  res.status(200).json({ success: true, data: items });
};

export const getLowStockItems = async (req: Request, res: Response) => {
  const items = await prisma.inventoryItem.findMany({
    where: { quantity: { lte: prisma.inventoryItem.fields.minQuantity } },
    orderBy: { quantity: 'asc' },
  });
  res.status(200).json({ success: true, data: items });
};

export const createItem = async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    category: z.nativeEnum(InventoryCategory),
    description: z.string().optional(),
    unit: z.string(),
    quantity: z.number().default(0),
    minQuantity: z.number().default(5),
    unitCost: z.number().default(0),
    hostelId: z.string().uuid().optional(),
  });
  const body = schema.parse(req.body);
  const item = await prisma.inventoryItem.create({ data: body });
  res.status(201).json({ success: true, data: item });
};

export const updateItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await prisma.inventoryItem.update({ where: { id }, data: req.body });
  res.status(200).json({ success: true, data: item });
};

export const recordUsage = async (req: Request, res: Response) => {
  const schema = z.object({
    itemId: z.string().uuid(),
    complaintId: z.string().uuid(),
    quantity: z.number().positive(),
    notes: z.string().optional(),
  });
  const body = schema.parse(req.body);

  const item = await prisma.inventoryItem.findUnique({ where: { id: body.itemId } });
  if (!item || item.quantity < body.quantity) {
    throw new Error('Insufficient inventory');
  }

  const usage = await prisma.inventoryUsage.create({
    data: { ...body, usedBy: req.user!.userId },
  });
  await prisma.inventoryItem.update({
    where: { id: body.itemId },
    data: { quantity: { decrement: body.quantity } },
  });

  res.status(201).json({ success: true, data: usage });
};
