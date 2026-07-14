import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { NotFoundError } from '../middlewares/errorHandler';

const CATEGORY_DATA = [
  { name: 'Electrical', icon: '⚡', color: '#F59E0B', subcategories: ['Fan not working', 'Tube light not working', 'Switch damaged', 'Socket issue', 'Power outage', 'Loose wiring', 'Fuse issue', 'Charging point issue'] },
  { name: 'Plumbing', icon: '🔧', color: '#3B82F6', subcategories: ['Water leakage', 'Tap damaged', 'Shower issue', 'Pipe leakage', 'Wash basin blockage', 'Toilet flush issue', 'Drain blockage'] },
  { name: 'Furniture', icon: '🪑', color: '#8B5CF6', subcategories: ['Broken bed', 'Broken chair', 'Damaged table', 'Cupboard issue', 'Shelf damaged', 'Mattress issue'] },
  { name: 'Internet & Network', icon: '📶', color: '#6366F1', subcategories: ['Wi-Fi not working', 'Slow internet', 'LAN issue', 'Router problem'] },
  { name: 'Appliances', icon: '🔌', color: '#EF4444', subcategories: ['Water cooler issue', 'Washing machine issue', 'Water purifier issue', 'Air conditioner issue'] },
  { name: 'Cleaning & Housekeeping', icon: '🧹', color: '#10B981', subcategories: ['Room cleaning', 'Washroom cleaning', 'Garbage collection', 'Corridor cleaning'] },
  { name: 'Doors & Windows', icon: '🚪', color: '#A8A29E', subcategories: ['Door lock issue', 'Broken door', 'Window damaged', 'Broken handle'] },
  { name: 'Safety & Security', icon: '🛡️', color: '#DC2626', subcategories: ['Fire extinguisher issue', 'CCTV issue', 'Emergency light issue', 'Security concern'] },
  { name: 'Pest Control', icon: '🐛', color: '#84CC16', subcategories: ['Mosquitoes', 'Cockroaches', 'Ants', 'Rats', 'Termites'] },
  { name: 'Water Supply', icon: '💧', color: '#0EA5E9', subcategories: ['No water', 'Low water pressure', 'Hot water issue'] },
  { name: 'Civil & Structural', icon: '🏗️', color: '#78716C', subcategories: ['Ceiling damage', 'Wall crack', 'Paint peeling', 'Floor damage'] },
  { name: 'Common Area Maintenance', icon: '🏢', color: '#14B8A6', subcategories: ['Lift issue', 'Staircase lighting', 'Corridor maintenance', 'Garden maintenance'] },
  { name: 'Others', icon: '📋', color: '#6B7280', subcategories: ['Custom issue'] },
];

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      subcategories: { where: { isActive: true } },
      _count: { select: { complaints: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.status(200).json({ success: true, data: categories });
};

export const createCategory = async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
  });
  const body = schema.parse(req.body);
  const category = await prisma.category.create({ data: body });
  res.status(201).json({ success: true, data: category });
};

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await prisma.category.update({ where: { id }, data: req.body });
  res.status(200).json({ success: true, data: category });
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.category.update({ where: { id }, data: { isActive: false } });
  res.status(200).json({ success: true, message: 'Category deactivated' });
};

export const createSubcategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
  });
  const body = schema.parse(req.body);
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError('Category');

  const subcategory = await prisma.subcategory.create({
    data: { ...body, categoryId: id },
  });
  res.status(201).json({ success: true, data: subcategory });
};

// Seed categories (utility used in seed script)
export const seedCategories = async () => {
  for (const cat of CATEGORY_DATA) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, icon: cat.icon, color: cat.color },
    });

    for (const subName of cat.subcategories) {
      await prisma.subcategory.upsert({
        where: { categoryId_name: { categoryId: category.id, name: subName } },
        update: {},
        create: { categoryId: category.id, name: subName },
      });
    }
  }
};
