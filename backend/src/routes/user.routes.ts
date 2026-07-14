import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getStudents,
  getWorkersList,
} from '../controllers/user.controller';

export const userRouter = Router();
userRouter.use(authenticate);

userRouter.get('/', authorize(Role.ADMIN, Role.SUPERVISOR, Role.MANAGEMENT), getUsers);
userRouter.get('/students', authorize(Role.ADMIN, Role.SUPERVISOR, Role.MANAGEMENT), getStudents);
userRouter.get('/workers', authorize(Role.ADMIN, Role.SUPERVISOR, Role.MANAGEMENT), getWorkersList);
userRouter.get('/:id', getUserById);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', authorize(Role.ADMIN, Role.MANAGEMENT), deleteUser);
userRouter.patch('/:id/status', authorize(Role.ADMIN, Role.MANAGEMENT), updateUserStatus);
