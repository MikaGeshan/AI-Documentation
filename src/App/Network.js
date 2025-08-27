import { Platform } from 'react-native';
import { NetworkInfo } from 'react-native-network-info';
import io from 'socket.io-client';

const Config = {
  API_URL: '',
  SOCKET_URL: '',
};

let socket = null;
let isConnected = false;

// Detects device IP and configures API & Socket URLs
export async function autoConfigureIP() {
  try {
    let deviceIP = await NetworkInfo.getIPV4Address();

    if (!deviceIP) {
      console.warn('[Network] Device IP not detected, using fallback LAN IP');
      deviceIP = '172.20.10.2';
    }

    let hostIP = deviceIP;

    if (Platform.OS === 'android' && deviceIP.startsWith('10.0.2')) {
      hostIP = '10.0.2.2';
    }

    Config.API_URL = `http://${hostIP}:8000`;
    Config.SOCKET_URL = `http://${hostIP}:3000`;

    console.log('[Network] Configured API_URL:', Config.API_URL);
    console.log('[Network] Configured SOCKET_URL:', Config.SOCKET_URL);

    return hostIP;
  } catch (err) {
    console.error(
      '[Network] Failed to auto-configure IP, using fallback:',
      err,
    );
    const fallbackIP = '172.20.10.2';
    Config.API_URL = `http://${fallbackIP}:8000`;
    Config.SOCKET_URL = `http://${fallbackIP}:3000`;
    return fallbackIP;
  }
}

// Initialize Socket.IO client
export const initializeSocket = async () => {
  if (socket && isConnected) {
    console.log('[Socket] Already connected.');
    return socket;
  }

  try {
    const hostIP = await autoConfigureIP();
    if (!hostIP) return null;

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
      console.error('[Socket] Connection error:', err);
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
