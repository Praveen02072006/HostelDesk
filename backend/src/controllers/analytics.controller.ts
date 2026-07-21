import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  const { hostelId, startDate, endDate } = req.query;
  const dateFilter: Record<string, unknown> = {};
  if (startDate) dateFilter.gte = new Date(startDate as string);
  if (endDate) dateFilter.lte = new Date(endDate as string);

  const where: Record<string, unknown> = {};
  if (hostelId) where.hostelId = hostelId;
  if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalComplaints,
    openComplaints,
    resolvedComplaints,
    thisMonthComplaints,
    lastMonthComplaints,
    slaBreaches,
    availableWorkers,
    avgResolution,
  ] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.count({ where: { ...where, status: { in: ['RAISED', 'VERIFIED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } } }),
    prisma.complaint.count({ where: { ...where, status: { in: ['COMPLETED', 'CLOSED', 'ARCHIVED'] } } }),
    prisma.complaint.count({ where: { ...where, createdAt: { gte: startOfMonth } } }),
    prisma.complaint.count({ where: { ...where, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.complaint.count({ where: { ...where, slaBreached: true } }),
    prisma.worker.count({ where: { isAvailable: true, ...(hostelId ? { hostelId: hostelId as string } : {}) } }),
    prisma.complaint.findMany({
      where: { ...where, completedAt: { not: null } },
      select: { createdAt: true, completedAt: true },
    }),
  ]);

  const avgResolutionMs = avgResolution.reduce((acc, c) => {
    if (c.completedAt) return acc + (c.completedAt.getTime() - c.createdAt.getTime());
    return acc;
  }, 0) / (avgResolution.length || 1);

  const avgResolutionHours = Math.round(avgResolutionMs / (1000 * 60 * 60));

  const monthlyGrowth = lastMonthComplaints > 0
    ? Math.round(((thisMonthComplaints - lastMonthComplaints) / lastMonthComplaints) * 100)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      totalComplaints,
      openComplaints,
      resolvedComplaints,
      thisMonthComplaints,
      lastMonthComplaints,
      monthlyGrowth,
      slaBreaches,
      availableWorkers,
      avgResolutionHours,
      resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0,
    },
  });
};

export const getComplaintTrends = async (req: Request, res: Response) => {
  const { months = '6', hostelId } = req.query;
  const monthsNum = parseInt(months as string);

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsNum + 1, 1);

  const where: Record<string, unknown> = { createdAt: { gte: startDate } };
  if (hostelId) where.hostelId = hostelId;

  // Single query to fetch all complaints in the date range
  const complaints = await prisma.complaint.findMany({
    where,
    select: { createdAt: true, status: true, slaBreached: true },
  });

  const resolvedStatuses = new Set(['COMPLETED', 'CLOSED', 'ARCHIVED']);
  const results = [];

  for (let i = monthsNum - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

    const monthComplaints = complaints.filter(c => c.createdAt >= start && c.createdAt <= end);
    const total = monthComplaints.length;
    const resolved = monthComplaints.filter(c => resolvedStatuses.has(c.status)).length;
    const slaBreached = monthComplaints.filter(c => c.slaBreached).length;

    results.push({
      month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
      total,
      resolved,
      slaBreached,
      open: total - resolved,
    });
  }

  res.status(200).json({ success: true, data: results });
};

export const getCategoryDistribution = async (req: Request, res: Response) => {
  const { hostelId } = req.query;
  const where: Record<string, unknown> = {};
  if (hostelId) where.hostelId = hostelId;

  const distribution = await prisma.complaint.groupBy({
    by: ['categoryId'],
    where,
    _count: { categoryId: true },
    orderBy: { _count: { categoryId: 'desc' } },
  });

  const categories = await prisma.category.findMany({ select: { id: true, name: true, color: true, icon: true } });
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const result = distribution.map(d => ({
    category: categoryMap.get(d.categoryId),
    count: d._count.categoryId,
  }));

  res.status(200).json({ success: true, data: result });
};

export const getWorkerPerformanceAnalytics = async (req: Request, res: Response) => {
  const { hostelId, limit = '10' } = req.query;
  const limitNum = parseInt(limit as string);

  const workerFilter: Record<string, unknown> = {};
  if (hostelId) workerFilter.hostelId = hostelId;

  const workers = await prisma.worker.findMany({
    where: workerFilter,
    include: {
      assignments: {
        select: { status: true, startedAt: true, completedAt: true },
      },
      feedbacks: { select: { rating: true } },
    },
    take: limitNum,
    orderBy: { rating: 'desc' },
  });

  const result = workers.map(w => {
    const completed = w.assignments.filter(a => a.status === 'COMPLETED').length;
    const avgRating = w.feedbacks.length
      ? w.feedbacks.reduce((acc, f) => acc + f.rating, 0) / w.feedbacks.length
      : 0;

    return {
      id: w.id,
      name: `${w.firstName} ${w.lastName}`,
      employeeId: w.employeeId,
      totalJobs: w.assignments.length,
      completedJobs: completed,
      completionRate: w.assignments.length > 0 ? Math.round((completed / w.assignments.length) * 100) : 0,
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: w.feedbacks.length,
    };
  });

  res.status(200).json({ success: true, data: result });
};

export const getResolutionTimeAnalytics = async (req: Request, res: Response) => {
  const { hostelId } = req.query;
  const where: Record<string, unknown> = { completedAt: { not: null } };
  if (hostelId) where.hostelId = hostelId;

  const byPriority = await prisma.complaint.groupBy({
    by: ['priority'],
    where,
    _count: { priority: true },
  });

  const complaints = await prisma.complaint.findMany({
    where,
    select: { priority: true, createdAt: true, completedAt: true },
  });

  const priorityTimes: Record<string, number[]> = {};
  complaints.forEach(c => {
    if (c.completedAt) {
      const hours = (c.completedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
      if (!priorityTimes[c.priority]) priorityTimes[c.priority] = [];
      priorityTimes[c.priority].push(hours);
    }
  });

  const result = byPriority.map(p => ({
    priority: p.priority,
    count: p._count.priority,
    avgResolutionHours: priorityTimes[p.priority]?.length
      ? Math.round(priorityTimes[p.priority].reduce((a, b) => a + b, 0) / priorityTimes[p.priority].length)
      : 0,
  }));

  res.status(200).json({ success: true, data: result });
};

export const getSLAAnalytics = async (req: Request, res: Response) => {
  const { hostelId } = req.query;
  const where: Record<string, unknown> = {};
  if (hostelId) where.hostelId = hostelId;

  const [total, breached, byPriority] = await Promise.all([
    prisma.complaint.count({ where: { ...where, slaDeadline: { not: null } } }),
    prisma.complaint.count({ where: { ...where, slaBreached: true } }),
    prisma.complaint.groupBy({
      by: ['priority'],
      where: { ...where, slaBreached: true },
      _count: { priority: true },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      breached,
      complianceRate: total > 0 ? Math.round(((total - breached) / total) * 100) : 100,
      breachedByPriority: byPriority,
    },
  });
};

export const getTopRooms = async (req: Request, res: Response) => {
  const { hostelId, limit = '10' } = req.query;
  const limitNum = parseInt(limit as string);
  const where: Record<string, unknown> = { roomId: { not: null } };
  if (hostelId) where.hostelId = hostelId;

  const topRooms = await prisma.complaint.groupBy({
    by: ['roomId'],
    where,
    _count: { roomId: true },
    orderBy: { _count: { roomId: 'desc' } },
    take: limitNum,
  });

  // Batch fetch all rooms in one query instead of N+1
  const roomIds = topRooms.map(r => r.roomId!).filter(Boolean);
  const rooms = roomIds.length > 0
    ? await prisma.room.findMany({
        where: { id: { in: roomIds } },
        include: { hostel: { select: { name: true } } },
      })
    : [];

  const roomMap = new Map(rooms.map(r => [r.id, r]));

  const roomDetails = topRooms.map(r => ({
    room: roomMap.get(r.roomId!) || null,
    complaintCount: r._count.roomId,
  }));

  res.status(200).json({ success: true, data: roomDetails });
};

export const getHostelComparison = async (_req: Request, res: Response) => {
  const hostels = await prisma.hostel.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { complaints: true, students: true, workers: true } },
    },
  });

  // Batch: get all resolved and SLA breached counts in two queries instead of 2*N
  const hostelIds = hostels.map(h => h.id);

  const [resolvedByHostel, slaByHostel] = await Promise.all([
    prisma.complaint.groupBy({
      by: ['hostelId'],
      where: { hostelId: { in: hostelIds }, status: { in: ['COMPLETED', 'CLOSED'] } },
      _count: { hostelId: true },
    }),
    prisma.complaint.groupBy({
      by: ['hostelId'],
      where: { hostelId: { in: hostelIds }, slaBreached: true },
      _count: { hostelId: true },
    }),
  ]);

  const resolvedMap = new Map(resolvedByHostel.map(r => [r.hostelId, r._count.hostelId]));
  const slaMap = new Map(slaByHostel.map(r => [r.hostelId, r._count.hostelId]));

  const result = hostels.map(h => {
    const resolved = resolvedMap.get(h.id) || 0;
    const slaBreached = slaMap.get(h.id) || 0;
    return {
      hostel: { id: h.id, name: h.name, code: h.code },
      totalComplaints: h._count.complaints,
      resolvedComplaints: resolved,
      slaBreached,
      studentCount: h._count.students,
      workerCount: h._count.workers,
      resolutionRate: h._count.complaints > 0 ? Math.round((resolved / h._count.complaints) * 100) : 0,
    };
  });

  res.status(200).json({ success: true, data: result });
};

export const exportReport = async (req: Request, res: Response) => {
  const { format = 'json', hostelId, startDate, endDate } = req.query;

  const where: Record<string, unknown> = {};
  if (hostelId) where.hostelId = hostelId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate as string);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate as string);
  }

  const complaints = await prisma.complaint.findMany({
    where,
    include: {
      category: { select: { name: true } },
      subcategory: { select: { name: true } },
      student: { select: { firstName: true, lastName: true, studentId: true } },
      hostel: { select: { name: true } },
      room: { select: { roomNumber: true, floor: true, block: true } },
      assignments: {
        include: { worker: { select: { firstName: true, lastName: true } } },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = complaints.map(c => ({
    'Ticket #': c.ticketNumber,
    'Title': c.title,
    'Category': c.category.name,
    'Subcategory': c.subcategory?.name || '',
    'Status': c.status,
    'Priority': c.priority,
    'Student': `${c.student.firstName} ${c.student.lastName}`,
    'Student ID': c.student.studentId,
    'Hostel': c.hostel.name,
    'Room': c.room ? `${c.room.block}-${c.room.floor}-${c.room.roomNumber}` : '',
    'Assigned Worker': c.assignments[0]?.worker ? `${c.assignments[0].worker.firstName} ${c.assignments[0].worker.lastName}` : 'Unassigned',
    'Raised At': c.createdAt.toISOString(),
    'Completed At': c.completedAt?.toISOString() || '',
    'SLA Breached': c.slaBreached ? 'Yes' : 'No',
    'Cost': c.actualCost?.toString() || '',
  }));

  if (format === 'csv') {
    if (data.length === 0) {
      res.status(200).send('No data');
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row as Record<string, string>)[h]}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="hosteldesk-report.csv"');
    res.send(csv);
    return;
  }

  res.status(200).json({ success: true, data });
};
