import { Platform } from 'react-native';
import { NetworkInfo } from 'react-native-network-info';
import Config from './config';

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
