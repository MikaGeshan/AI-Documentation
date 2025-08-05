import { io } from 'socket.io-client';

let socket = null;

export function initializeSocket(SOCKET_URL) {
  socket = io(SOCKET_URL, { transports: ['websocket'] });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', err => {
    console.log('Socket connection error:', err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}
