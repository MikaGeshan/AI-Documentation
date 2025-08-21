import { Platform } from 'react-native';
import { NetworkInfo } from 'react-native-network-info';
import io from 'socket.io-client';

const Config = {
  API_URL: '',
  SOCKET_URL: '',
};

let socket = null;
let isConnected = false;

//  Automatically configures API_URL and SOCKET_URL based on the device's IP.
//  Returns the detected IP or null if failed.
export async function autoConfigureIP() {
  try {
    const deviceIP = await NetworkInfo.getIPV4Address();
    let API_IP;

    if (Platform.OS === 'android') {
      API_IP = deviceIP.startsWith('10.0.2') ? '10.0.2.2' : deviceIP;
    } else if (Platform.OS === 'ios') {
      API_IP = deviceIP === '127.0.0.1' ? '127.0.0.1' : deviceIP;
    }

    Config.API_URL = `http://${API_IP}:8000`;
    Config.SOCKET_URL = `http://${API_IP}:3000`;

    console.log('Configured API_URL:', Config.API_URL);
    console.log('Configured SOCKET_URL:', Config.SOCKET_URL);

    return API_IP;
  } catch (err) {
    console.error('Failed to auto-configure IP:', err);
    return null;
  }
}

//Initializes and returns a socket.io client instance.

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

    socket = io(Config.SOCKET_URL, {
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

// Disconnects the socket manually.

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log('Socket disconnected manually.');
  }
};

//  Returns the current socket instance.

export const getSocket = () => socket;

export default Config;
