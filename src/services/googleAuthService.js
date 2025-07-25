import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { API_URL } from '@env';
import axios from 'axios';

export const signInWithGoogle = async ({ handleSuccessfulLogin }) => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    const idToken = userInfo?.idToken || userInfo?.data?.idToken;
    if (!idToken) {
      throw new Error('ID Token tidak ditemukan dalam userInfo');
    }

    const res = await axios.post(`${API_URL}/api/auth/google`, { idToken });

    const { token, user, role } = res.data;

    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('role', role);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    await handleSuccessfulLogin({ access_token: token, user });
  } catch (error) {
    console.error('Google Sign-In error:', error?.message || error);
  }
};
