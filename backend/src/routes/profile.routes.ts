import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getMyProfile,
  updateProfile,
  changePassword,
  getSessions,
  revokeSession
} from '../controllers/profile.controller';

export const profileRouter = Router();

profileRouter.use(authenticate);

profileRouter.get('/', getMyProfile);
profileRouter.put('/', updateProfile);
profileRouter.patch('/', updateProfile);
profileRouter.put('/password', changePassword);
profileRouter.get('/sessions', getSessions);
profileRouter.delete('/sessions/:sessionId', revokeSession);
