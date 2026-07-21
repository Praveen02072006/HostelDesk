import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import 'express-async-errors';

import { env } from './config/env';
import { connectDatabase } from './config/database';
import { initializeSocket } from './socket';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import { setupSwagger } from './config/swagger';
import { logger } from './utils/logger';
import { startCronJobs } from './cron';

const app = express();
const server = http.createServer(app);

// ============================================================
// INITIALIZE SOCKET.IO
// ============================================================
initializeSocket(server);

// ============================================================
// SECURITY MIDDLEWARES
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:5173', 'https://hostel-desk-red.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ============================================================
// GENERAL MIDDLEWARES
// ============================================================
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));
app.use(cookieParser(env.COOKIE_SECRET));
// Vercel serverless environment already parses the body
app.use((req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) return next();
  express.json({ limit: '5mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) return next();
  express.urlencoded({ extended: true, limit: '5mb' })(req, res, next);
});

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'short' : 'dev', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (_req, res) => env.NODE_ENV === 'production' && res.statusCode < 400,
  }));
}

// ============================================================
// RATE LIMITING
// ============================================================
app.use('/api', rateLimiter);

// ============================================================
// API DOCUMENTATION (dev/staging only for faster prod startup)
// ============================================================
if (env.NODE_ENV !== 'production') {
  setupSwagger(app);
}

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
  });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api', apiRouter);

// ============================================================
// ERROR HANDLERS
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
const start = async () => {
  await connectDatabase();
  startCronJobs();

  if (process.env.VERCEL !== '1') {
    server.listen(env.PORT, () => {
      logger.info(`🚀 HostelDesk API running on port ${env.PORT}`);
      logger.info(`📚 Swagger docs: http://localhost:${env.PORT}/api-docs`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });
  }
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
export { app, server };
