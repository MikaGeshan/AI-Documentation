import io from 'socket.io-client';

const Config = {
  API_URL: 'https://ai-documentation-backend-pk2qh.sevalla.app',
  SOCKET_URL: 'https://ai-documentation-backend-pk2qh.sevalla.app',
};

let socket = null;
let isConnected = false;

// Initialize Socket.IO client
export const initializeSocket = async () => {
  if (socket && isConnected) {
    console.log('[Socket] Already connected.');
    return socket;
  }

  try {
    socket = io(Config.SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      timeout: 50000,
    });

    socket.on('connect', () => {
      isConnected = true;
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      isConnected = false;
      console.log('[Socket] Disconnected');
    });

    socket.on('connect_error', err => {
      console.error('[Socket] Connection error:', err.message);
    });

    return socket;
  } catch (err) {
    console.error('[Socket] Failed to initialize:', err);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log('[Socket] Disconnected manually.');
  }
};

export const getSocket = () => socket;

export default Config;
