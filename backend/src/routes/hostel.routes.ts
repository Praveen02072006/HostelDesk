import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { getHostels, getHostelById, createHostel, updateHostel } from '../controllers/hostel.controller';

export const hostelRouter = Router();
hostelRouter.use(authenticate);
hostelRouter.get('/', getHostels);
hostelRouter.get('/:id', getHostelById);
hostelRouter.post('/', authorize(Role.ADMIN, Role.MANAGEMENT), createHostel);
hostelRouter.put('/:id', authorize(Role.ADMIN, Role.MANAGEMENT), updateHostel);
