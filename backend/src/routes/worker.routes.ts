import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import {
  getWorkerJobs,
  acceptJob,
  rejectJob,
  markInProgress,
  markCompleted,
  getWorkerPerformance,
  getWorkerStats,
} from '../controllers/worker.controller';

export const workerRouter = Router();
workerRouter.use(authenticate);

workerRouter.get('/jobs', authorize(Role.WORKER), getWorkerJobs);
workerRouter.patch('/jobs/:assignmentId/accept', authorize(Role.WORKER), acceptJob);
workerRouter.patch('/jobs/:assignmentId/reject', authorize(Role.WORKER), rejectJob);
workerRouter.patch('/jobs/:assignmentId/in-progress', authorize(Role.WORKER), markInProgress);
workerRouter.patch('/jobs/:assignmentId/complete', authorize(Role.WORKER), markCompleted);
workerRouter.get('/performance', authorize(Role.WORKER, Role.SUPERVISOR, Role.ADMIN, Role.MANAGEMENT), getWorkerPerformance);
workerRouter.get('/stats', authorize(Role.WORKER), getWorkerStats);
