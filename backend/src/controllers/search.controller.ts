import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json({ success: true, data: { complaints: [], users: [], rooms: [] } });
    }

    const searchQuery = q.toLowerCase();

    // 1. Search Complaints – by ticket, title, description, category name, subcategory name, roomNumber
    const complaints = await prisma.complaint.findMany({
      where: {
        OR: [
          { ticketNumber: { contains: searchQuery, mode: 'insensitive' } },
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { roomNumber: { contains: searchQuery, mode: 'insensitive' } },
          { category: { name: { contains: searchQuery, mode: 'insensitive' } } },
          { subcategory: { name: { contains: searchQuery, mode: 'insensitive' } } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        roomNumber: true,
        createdAt: true,
        category: { select: { id: true, name: true, color: true, icon: true } },
        subcategory: { select: { id: true, name: true } },
      },
    });

    let users: any[] = [];
    let rooms: any[] = [];

    // 2. Search Users & Rooms if Admin/Management/Supervisor
    const role = req.user?.role;
    if (role === Role.ADMIN || role === Role.MANAGEMENT || role === Role.SUPERVISOR) {
      const allUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: searchQuery, mode: 'insensitive' } },
            { student: { firstName: { contains: searchQuery, mode: 'insensitive' } } },
            { student: { lastName: { contains: searchQuery, mode: 'insensitive' } } },
            { worker: { firstName: { contains: searchQuery, mode: 'insensitive' } } },
            { worker: { lastName: { contains: searchQuery, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        select: {
          id: true,
          email: true,
          role: true,
          student: { select: { firstName: true, lastName: true } },
          worker: { select: { firstName: true, lastName: true } },
        },
      });
      users = allUsers;

      const allRooms = await prisma.room.findMany({
        where: {
          OR: [
            { roomNumber: { contains: searchQuery, mode: 'insensitive' } },
            { block: { contains: searchQuery, mode: 'insensitive' } },
          ]
        },
        take: 5,
        select: { id: true, roomNumber: true, block: true, hostel: { select: { name: true } } },
      });
      rooms = allRooms;
    }

    res.json({
      success: true,
      data: {
        complaints,
        users,
        rooms,
      },
    });
  } catch (error) {
    next(error);
  }
};
