import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignWorker,
  cancelComplaint,
  addComplaintNote,
  getComplaintTimeline,
  escalateComplaint,
  getMyComplaints,
  updateComplaintPriority,
  getComplaintStats,
  bulkAssign,
} from '../controllers/complaint.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

export const complaintRouter = Router();

// All routes require authentication
complaintRouter.use(authenticate);

// Student routes
complaintRouter.post('/', authorize(Role.STUDENT), createComplaint);
complaintRouter.get('/my', authorize(Role.STUDENT), getMyComplaints);
complaintRouter.patch('/:id/cancel', authorize(Role.STUDENT), cancelComplaint);

// Admin/Supervisor routes
complaintRouter.get(
  '/',
  authorize(Role.ADMIN, Role.SUPERVISOR, Role.MANAGEMENT, Role.WORKER),
  getComplaints
);
complaintRouter.get('/stats', authorize(Role.ADMIN, Role.SUPERVISOR, Role.MANAGEMENT), getComplaintStats);
complaintRouter.patch('/:id/assign', authorize(Role.ADMIN, Role.SUPERVISOR), assignWorker);
complaintRouter.patch('/:id/priority', authorize(Role.ADMIN, Role.SUPERVISOR), updateComplaintPriority);
complaintRouter.patch('/:id/escalate', authorize(Role.ADMIN, Role.SUPERVISOR, Role.MANAGEMENT), escalateComplaint);
complaintRouter.post('/bulk-assign', authorize(Role.ADMIN, Role.SUPERVISOR), bulkAssign);

// Shared routes
complaintRouter.get('/:id', getComplaintById);
complaintRouter.patch('/:id/status', updateComplaintStatus);
complaintRouter.post('/:id/notes', addComplaintNote);
complaintRouter.get('/:id/timeline', getComplaintTimeline);
