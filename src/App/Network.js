import io from 'socket.io-client';
import { autoConfigureIP } from '../configs/networkConfig';

let socket = null;
let isConnected = false;

export const initializeSocket = async () => {
  if (socket && isConnected) {
    console.log('Socket already connected.');
    return socket;
  }

  try {
    const ip = await autoConfigureIP();
    if (!ip) {
      console.warn('No IP available, socket not initialized.');
      return null;
    }

    socket = io(`http://${ip}:3000`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      timeout: 50000,
    });

    socket.on('connect', () => {
      isConnected = true;
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      isConnected = false;
      console.log('Socket disconnected');
    });

    socket.on('connect_error', err => {
      console.error('Socket connection error:', err);
    });

    return socket;
  } catch (err) {
    console.error('Failed to initialize socket:', err);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log('Socket disconnected manually.');
  }
};

export const getSocket = () => socket;
