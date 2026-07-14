import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimiter';

export const authRouter = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string, enum: [STUDENT, WORKER, ADMIN, SUPERVISOR, MANAGEMENT] }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201: { description: User registered successfully }
 *       409: { description: Email already exists }
 */
authRouter.post('/register', authRateLimiter, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
authRouter.post('/login', authRateLimiter, login);
authRouter.post('/logout', authenticate, logout);
authRouter.post('/refresh-token', refreshToken);
authRouter.post('/forgot-password', authRateLimiter, forgotPassword);
authRouter.post('/reset-password', authRateLimiter, resetPassword);
authRouter.get('/profile', authenticate, getProfile);
authRouter.put('/change-password', authenticate, changePassword);
