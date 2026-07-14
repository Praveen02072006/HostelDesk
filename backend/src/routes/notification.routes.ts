import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller';

export const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get('/', getNotifications);
notificationRouter.patch('/:id/read', markAsRead);
notificationRouter.patch('/read-all', markAllAsRead);
notificationRouter.delete('/:id', deleteNotification);
