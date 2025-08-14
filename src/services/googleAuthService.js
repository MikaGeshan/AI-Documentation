import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env';
import axios from 'axios';
import Config from '../configs/config';

export const signInWithGoogle = async ({ handleSuccessfulLogin }) => {
  try {
    console.log('[GoogleAuth] Checking Play Services...');
    await GoogleSignin.hasPlayServices();
    console.log('[GoogleAuth] Play Services OK.');

    console.log('[GoogleAuth] Starting Google Sign-In...');
    const userInfo = await GoogleSignin.signIn();
    console.log('[GoogleAuth] Google Sign-In success:', userInfo);

    const idToken = userInfo?.idToken || userInfo?.data?.idToken;
    if (!idToken) {
      console.error('[GoogleAuth] ID Token not found in userInfo');
      throw new Error('ID Token tidak ditemukan dalam userInfo');
    }
    console.log('[GoogleAuth] ID Token retrieved:', idToken);

    const serverAuthCode =
      userInfo?.serverAuthCode || userInfo?.data?.serverAuthCode;

    if (!serverAuthCode) {
      console.error('[GoogleAuth] Server Auth Code not found in userInfo');
      throw new Error('Server Auth Code tidak ditemukan dalam userInfo');
    }

    const email = userInfo?.email || userInfo?.data?.user?.email;

    if (!email) {
      console.error('[GoogleAuth] Account email not found in userInfo');
      throw new Error('Account email tidak ditemukan dalam userInfo');
    }
    console.log('[GoogleAuth] Account email retrieved:', email);

    console.log('[GoogleAuth] Sending data to backend...');
    const res = await axios.post(`${Config.API_URL}/api/auth/google`, {
      idToken,
      email,
      serverAuthCode,
    });
    console.log('[GoogleAuth] Backend response:', res.data);

    const { token, user } = res.data;

    console.log('[GoogleAuth] Received token:', token);
    console.log('[GoogleAuth] Received user:', user);

    console.log('[GoogleAuth] Storing tokens in AsyncStorage...');
    await AsyncStorage.setItem('ID_Token', idToken);
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('role', user.role || 'user');
    await AsyncStorage.setItem('user', JSON.stringify(user));
    console.log('[GoogleAuth] Tokens stored successfully.');

    console.log('[GoogleAuth] Calling handleSuccessfulLogin callback...');
    await handleSuccessfulLogin({ access_token: token, user });
    console.log('[GoogleAuth] handleSuccessfulLogin finished.');
  } catch (error) {
    console.error('[GoogleAuth] Sign-In error:', error?.message || error);
  }
};

export const configureGoogleSignIn = () => {
  console.log('[GoogleAuth] Configuring Google Sign-In...');
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    client_type: '3',
    offlineAccess: true,
    scopes: ['profile', 'email'],
  });
  console.log('[GoogleAuth] Google Sign-In configured.');
};
