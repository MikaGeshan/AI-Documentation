import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env';
import axios from 'axios';
import Config from './Network';

// Google Sign In
export const configureGoogleSignIn = () => {
  console.log('[GoogleAuth] Configuring Google Sign-In...');
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  console.log('[GoogleAuth] Google Sign-In configured.');
};

export const signInWithGoogle = async ({ handleSuccessfulLogin }) => {
  try {
    console.log('[GoogleAuth] Checking Play Services...');
    await GoogleSignin.hasPlayServices();
    console.log('[GoogleAuth] Play Services OK.');

    console.log('[GoogleAuth] Starting Google Sign-In...');
    const userInfo = await GoogleSignin.signIn();
    console.log(
      '[GoogleAuth] Raw userInfo:',
      JSON.stringify(userInfo, null, 2),
    );

    const idToken = userInfo?.idToken;
    const serverAuthCode = userInfo?.serverAuthCode;
    const email = userInfo?.user?.email;

    console.log('[GoogleAuth] Extracted:', { idToken, serverAuthCode, email });

    if (!idToken || !serverAuthCode || !email) {
      throw new Error('Missing credentials from Google Sign-In');
    }

    console.log('[GoogleAuth] Sending data to backend:', Config.API_URL);
    const res = await axios.post(`${Config.API_URL}/api/auth/google`, {
      idToken,
      email,
      serverAuthCode,
    });

    console.log('[GoogleAuth] Backend response:', res.data);

    const { token, user } = res.data;

    await AsyncStorage.setItem('ID_Token', idToken);
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('role', user.role || 'user');
    await AsyncStorage.setItem('user', JSON.stringify(user));

    await handleSuccessfulLogin({ access_token: token, user });
    console.log('[GoogleAuth] Google Sign-In flow complete.');
  } catch (error) {
    console.error(
      '[GoogleAuth] Sign-In error details:',
      error?.message || error,
      error,
    );
  }
};

// Google Drive
export const getFolderContents = async () => {
  try {
    const url = `${Config.API_URL}/api/drive-contents`;
    console.log('[GoogleDrive] Fetching folder contents from:', url);

    const response = await axios.get(url);
    const data = response.data;

    const mapped = {
      subfolders: data.subfolders.map(sub => ({
        id: sub.id,
        name: sub.name,
        webViewLink: sub.webViewLink,
        files: sub.files.map(file => ({
          ...file,
          downloadUrl:
            file.mimeType === 'application/vnd.google-apps.document'
              ? file.webViewLink
              : `https://drive.google.com/uc?id=${file.id}&export=download`,
        })),
      })),
    };

    console.log('[GoogleDrive] Mapped folder contents:', mapped);
    return mapped;
  } catch (error) {
    console.error(
      '[GoogleDrive] Failed to fetch drive contents:',
      error?.response?.data || error.message,
    );
    return null;
  }
};

export const convertDocument = async fileId => {
  try {
    if (!fileId) throw new Error('Missing file ID');

    const backendUrl = `${Config.API_URL}/api/convert-docs`;
    console.log('[GoogleDrive] Calling backend at:', backendUrl);

    const response = await axios.post(backendUrl, { file_id: fileId });
    const data = response.data;

    if (data?.error) throw new Error(`Backend error: ${data.error}`);
    if (!data?.text) throw new Error('Invalid response from backend');

    console.log('[GoogleDrive] Document conversion successful from backend');
    return {
      fileId,
      title: data.title || 'Untitled',
      content: data.text,
    };
  } catch (error) {
    console.error('[GoogleDrive] Document conversion failed:', error.message);
    return null;
  }
};
