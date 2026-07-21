import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const initSocket = (token: string) => {
  if (socket?.connected) return;

  // Disconnect any stale socket before creating a new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // Prefer websocket (faster, lower latency)
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000, // Exponential backoff up to 30s
    timeout: 10000,
    forceNew: false,
  });

  socket.on('connect', () => {
    if (import.meta.env.DEV) console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    if (import.meta.env.DEV) console.log('Socket disconnected');
  });

  socket.on('notification', (data) => {
    // Show toast for new notifications based on type
    if (data.type === 'HIGH_PRIORITY_ALERT' || data.type === 'SLA_BREACH') {
      toast.error(data.message, { duration: 6000, icon: '🚨' });
    } else {
      toast.success(data.message, { duration: 4000 });
    }

    // Dispatch event for components to listen to
    window.dispatchEvent(new CustomEvent('new_notification', { detail: data }));
  });
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToComplaint = (complaintId: string) => {
  if (socket?.connected) socket.emit('subscribe:complaint', complaintId);
};

export const unsubscribeFromComplaint = (complaintId: string) => {
  if (socket?.connected) socket.emit('unsubscribe:complaint', complaintId);
};

