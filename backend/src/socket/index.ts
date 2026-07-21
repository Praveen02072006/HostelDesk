import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

let io: Server;

const onlineUsers = new Map<string, string>(); // userId -> socketId

export const initializeSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'https://hostel-desk-red.vercel.app',
        'https://hostel-desk-red.vercel.app/'
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB max payload
    httpCompression: {
      threshold: 1024, // Compress payloads > 1KB
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?.userId;
    if (!userId) return;

    onlineUsers.set(userId, socket.id);
    logger.debug(`User connected: ${userId} (socket: ${socket.id})`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join role-based room
    const role = socket.data.user?.role;
    if (role) {
      socket.join(`role:${role}`);
    }

    // Handle complaint room subscription
    socket.on('subscribe:complaint', (complaintId: string) => {
      socket.join(`complaint:${complaintId}`);
    });

    socket.on('unsubscribe:complaint', (complaintId: string) => {
      socket.leave(`complaint:${complaintId}`);
    });

    // Handle typing indicator
    socket.on('typing', (data: { complaintId: string; isTyping: boolean }) => {
      socket.to(`complaint:${data.complaintId}`).emit('user:typing', {
        userId,
        isTyping: data.isTyping,
      });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      logger.debug(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export const emitNotification = (
  userId: string,
  notification: {
    title: string;
    message: string;
    type: string;
    complaintId?: string;
  }
): void => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }
};

export const emitComplaintUpdate = (
  complaintId: string,
  data: Record<string, unknown>
): void => {
  if (io) {
    io.to(`complaint:${complaintId}`).emit('complaint:updated', {
      complaintId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
};

export const emitToRole = (role: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

export { io };
