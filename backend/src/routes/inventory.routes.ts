import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { getInventory, createItem, updateItem, recordUsage, getLowStockItems } from '../controllers/inventory.controller';

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);
const adminRoles = [Role.ADMIN, Role.SUPERVISOR, Role.MANAGEMENT];
inventoryRouter.get('/', authorize(...adminRoles), getInventory);
inventoryRouter.get('/low-stock', authorize(...adminRoles), getLowStockItems);
inventoryRouter.post('/', authorize(Role.ADMIN, Role.MANAGEMENT), createItem);
inventoryRouter.put('/:id', authorize(Role.ADMIN, Role.MANAGEMENT), updateItem);
inventoryRouter.post('/usage', authorize(Role.WORKER, Role.ADMIN), recordUsage);
