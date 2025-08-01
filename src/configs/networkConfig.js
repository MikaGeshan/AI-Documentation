import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { NetworkInfo } from 'react-native-network-info';
import Config from './config';

export async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permission Required',
        message: 'This app needs location access to detect your network.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

export async function autoConfigureIP() {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.warn('Permission denied');
    return;
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      async () => {
        try {
          const deviceIP = await NetworkInfo.getIPV4Address();

          let API_URL;

          if (
            Platform.OS === 'android' &&
            (deviceIP?.startsWith('10.0.2') || deviceIP === '127.0.0.1')
          ) {
            API_URL = '10.0.2.2';
          } else if (Platform.OS === 'android') {
            API_URL = '192.168.1.10';
          } else if (Platform.OS === 'ios') {
            API_URL = '172.20.10.2';
          }

          Config.API_URL = `http://${API_URL}:8000`;
          Config.SOCKET_URL = `http://${API_URL}:3000`;
          console.log('Configured API_URL:', Config.API_URL);
          resolve(API_URL);
        } catch (err) {
          reject(err);
        }
      },
      error => {
        console.error('Geolocation error:', error);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  });
}
