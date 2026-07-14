import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { getAuditLogs } from '../controllers/audit.controller';

export const auditRouter = Router();
auditRouter.use(authenticate);
auditRouter.get('/', authorize(Role.ADMIN, Role.MANAGEMENT), getAuditLogs);
