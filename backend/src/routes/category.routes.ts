import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { getCategories, createCategory, updateCategory, deleteCategory, createSubcategory } from '../controllers/category.controller';

export const categoryRouter = Router();
categoryRouter.use(authenticate);
categoryRouter.get('/', getCategories);
categoryRouter.post('/', authorize(Role.ADMIN, Role.MANAGEMENT), createCategory);
categoryRouter.put('/:id', authorize(Role.ADMIN, Role.MANAGEMENT), updateCategory);
categoryRouter.delete('/:id', authorize(Role.ADMIN, Role.MANAGEMENT), deleteCategory);
categoryRouter.post('/:id/subcategories', authorize(Role.ADMIN, Role.MANAGEMENT), createSubcategory);
