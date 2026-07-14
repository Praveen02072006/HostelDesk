import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const initSocket = (token: string) => {
  if (socket?.connected) return;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
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
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToComplaint = (complaintId: string) => {
  if (socket) socket.emit('subscribe:complaint', complaintId);
};

export const unsubscribeFromComplaint = (complaintId: string) => {
  if (socket) socket.emit('unsubscribe:complaint', complaintId);
};
