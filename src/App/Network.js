import { NativeModules, Platform } from 'react-native';

const Config = {
  API_URL: Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000',
};

/**
 * Dynamically configures the API_URL to match the Metro server host IP.
 * This allows physical devices and emulators to seamlessly connect to the backend.
 */
export const autoConfigureIP = async () => {
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      // Example: "http://192.168.1.50:8081/index.bundle?platform=ios" -> "192.168.1.50"
      const hostPart = scriptURL.split('://')[1];
      if (hostPart) {
        const address = hostPart.split(':')[0];
        if (address && address !== 'localhost' && address !== '127.0.0.1') {
          Config.API_URL = `http://${address}:3000`;
          console.log('[Network] Configured API_URL to:', Config.API_URL);
          return address;
        }
      }
    }
  } catch (err) {
    console.warn('[Network] Failed to auto-configure server IP:', err.message);
  }

  // Fallback default setting for android emulator
  if (Platform.OS === 'android' && Config.API_URL === 'http://localhost:3000') {
    Config.API_URL = 'http://10.0.2.2:3000';
  }

  console.log('[Network] Defaulting API_URL to:', Config.API_URL);
  return null;
};

export default Config;
