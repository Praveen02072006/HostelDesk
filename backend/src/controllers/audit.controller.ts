import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getAuditLogs = async (req: Request, res: Response) => {
  const { page = '1', limit = '50', action, targetType } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            student: { select: { firstName: true, lastName: true } },
            admin: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: { logs, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
  });
};
