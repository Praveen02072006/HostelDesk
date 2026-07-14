import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import {
  getDashboardAnalytics,
  getComplaintTrends,
  getCategoryDistribution,
  getWorkerPerformanceAnalytics,
  getResolutionTimeAnalytics,
  getSLAAnalytics,
  getTopRooms,
  getHostelComparison,
  exportReport,
} from '../controllers/analytics.controller';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

const adminRoles = [Role.ADMIN, Role.SUPERVISOR, Role.MANAGEMENT];

analyticsRouter.get('/dashboard', authorize(...adminRoles), getDashboardAnalytics);
analyticsRouter.get('/trends', authorize(...adminRoles), getComplaintTrends);
analyticsRouter.get('/categories', authorize(...adminRoles), getCategoryDistribution);
analyticsRouter.get('/workers', authorize(...adminRoles), getWorkerPerformanceAnalytics);
analyticsRouter.get('/resolution-time', authorize(...adminRoles), getResolutionTimeAnalytics);
analyticsRouter.get('/sla', authorize(...adminRoles), getSLAAnalytics);
analyticsRouter.get('/top-rooms', authorize(...adminRoles), getTopRooms);
analyticsRouter.get('/hostel-comparison', authorize(Role.MANAGEMENT), getHostelComparison);
analyticsRouter.get('/export', authorize(...adminRoles), exportReport);
