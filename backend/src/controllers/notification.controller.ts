import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getNotifications = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', unreadOnly } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (unreadOnly === 'true') where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } }),
  ]);

  res.status(200).json({
    success: true,
    data: { notifications, unreadCount, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
  });
};

export const markAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.notification.update({
    where: { id, userId: req.user!.userId },
    data: { isRead: true, readAt: new Date() },
  });
  res.status(200).json({ success: true });
};

export const markAllAsRead = async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  res.status(200).json({ success: true });
};

export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.notification.delete({ where: { id, userId: req.user!.userId } });
  res.status(200).json({ success: true });
};
