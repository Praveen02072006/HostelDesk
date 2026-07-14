import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { getRooms, getRoomById, createRoom, updateRoom, generateQRCode, getRoomByQR } from '../controllers/room.controller';

export const roomRouter = Router();
roomRouter.use(authenticate);
roomRouter.get('/', getRooms);
roomRouter.get('/qr/:qrCode', getRoomByQR);
roomRouter.get('/:id', getRoomById);
roomRouter.post('/', authorize(Role.ADMIN, Role.MANAGEMENT), createRoom);
roomRouter.put('/:id', authorize(Role.ADMIN, Role.MANAGEMENT), updateRoom);
roomRouter.post('/:id/generate-qr', authorize(Role.ADMIN), generateQRCode);
