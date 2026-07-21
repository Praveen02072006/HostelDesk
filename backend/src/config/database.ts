import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const prisma = global.__prisma || new PrismaClient({
  log: isProduction
    ? [{ level: 'error', emit: 'stdout' }]
    : [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
});

if (!isProduction) {
  global.__prisma = prisma;
}

// Log slow queries in development only
if (isDevelopment) {
  prisma.$on('query' as never, (e: { query: string; duration: number }) => {
    if (e.duration > 200) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};
