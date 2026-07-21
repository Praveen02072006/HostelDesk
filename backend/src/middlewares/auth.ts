import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { Role } from '@prisma/client';
import { prisma } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// ============================================================
// In-memory user cache to avoid DB hit on every request
// ============================================================
interface CachedUser {
  id: string;
  isActive: boolean;
  role: string;
  email: string;
  cachedAt: number;
}

const userCache = new Map<string, CachedUser>();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // Cleanup every 10 minutes

// Periodic cache cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache) {
    if (now - value.cachedAt > USER_CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

export const invalidateUserCache = (userId: string) => {
  userCache.delete(userId);
};

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.split(' ')[1];

  const payload = verifyAccessToken(token);

  // Check cache first before hitting DB
  const cached = userCache.get(payload.userId);
  const now = Date.now();

  if (cached && (now - cached.cachedAt) < USER_CACHE_TTL) {
    if (!cached.isActive) {
      throw new UnauthorizedError('User account is inactive or does not exist');
    }
    req.user = payload;
    return next();
  }

  // Cache miss or expired - query DB
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true, role: true, email: true },
  });

  if (!user || !user.isActive) {
    userCache.delete(payload.userId);
    throw new UnauthorizedError('User account is inactive or does not exist');
  }

  // Cache the result
  userCache.set(payload.userId, {
    ...user,
    cachedAt: now,
  });

  req.user = payload;
  next();
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyAccessToken(token);
  } catch {
    // Optional auth - don't throw
  }

  next();
};

