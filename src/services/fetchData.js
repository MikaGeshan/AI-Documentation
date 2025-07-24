import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../navigation/RootNavigation';

export const checkAuthStatus = async () => {
  const token = await AsyncStorage.getItem('token');

  const waitUntilNavigationReady = () =>
    new Promise(resolve => {
      if (navigationRef.isReady()) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (navigationRef.isReady()) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });

  await waitUntilNavigationReady();

  if (token) {
    console.log('User is authenticated.');
    navigationRef.navigate('ScreenBottomTabs');
  } else {
    console.log('Token not found, redirect to login.');
    navigationRef.navigate('Login');
  }
};
