import React, { useEffect, useCallback } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Alert, Linking } from 'react-native';
import axios from 'axios';
import VerifyOTPComponent from '../Components/VerifyOTPComponent';
import VerifyOTPActions from '../Stores/VerifyOTPActions';
import SignInActions from '../Stores/SignInActions';
import Config from '../../../App/Network';

const VerifyOTPContainer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { login } = SignInActions();
  const { formData } = route.params ?? {};

  const {
    code,
    error,
    isVerifying,
    isResending,
    setCode,
    setError,
    setIsVerifying,
    setIsResending,
  } = VerifyOTPActions();

  const handleTokenLogin = useCallback(
    async token => {
      try {
        console.log('[Auth] JWT token found:', token);
        const response = await axios.get(`${Config.API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data.user;
        await login({ access_token: token, user });
        navigation.replace('ScreenBottomTabs');
      } catch (err) {
        console.error('[Auth] Failed to login with token:', err);
        Alert.alert('Google Auth Failed', 'Could not complete authentication.');
      }
    },
    [login, navigation],
  );

  useEffect(() => {
    const handleDeepLink = event => {
      const url = event.url;
      console.log('[DeepLink] URL received:', url);

      const code = url?.match(/code=([^&]+)/)?.[1];
      const email = formData?.email?.trim().toLowerCase();

      console.log('[DeepLink] Extracted email and code:', email, code);

      if (!code) {
        console.log('[DeepLink] No Google code found in URL');
        return;
      }

      console.log('[DeepLink] Google code received:', code);

      axios
        .post(`${Config.API_URL}/api/auth/google/get-token`, {
          code,
          email,
        })
        .then(response => {
          const { access_token } = response.data;
          if (!access_token) throw new Error('No token returned');
          handleTokenLogin(access_token);
        })
        .catch(err => {
          console.error('[DeepLink] Failed to exchange Google code:', err);
          Alert.alert(
            'Google Auth Failed',
            'Could not exchange Google code for token.',
          );
        });
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL()
      .then(url => {
        if (url) handleDeepLink({ url });
      })
      .catch(err => console.error('[DeepLink] getInitialURL error:', err));

    return () => {
      subscription.remove();
    };
  }, [formData.email, handleTokenLogin]);

  const handleVerify = async () => {
    if (!validateCode()) return;

    setIsVerifying(true);
    setError('');

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        otp: code,
      };

      console.log('[OTP] Sending verify request:', payload);
      const response = await axios.post(
        `${Config.API_URL}/api/verify-otp`,
        payload,
      );
      const { auth_url, access_token, user, google_tokens } = response.data;

      console.log('[OTP] Response:', response.data);

      if (auth_url) {
        const separator = auth_url.includes('?') ? '&' : '?';
        const authUrlWithMobile = `${auth_url}${separator}mobile=1`;
        console.log('[OTP] Opening Google consent browser:', authUrlWithMobile);
        await Linking.openURL(authUrlWithMobile);
        return;
      }

      await login({ access_token, user, google_tokens });
      navigation.replace('ScreenBottomTabs');
    } catch (err) {
      console.error('[OTP] Verification failed:', err);
      setError(
        err.response?.data?.message || 'Verification failed. Please try again.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = value => {
    setCode(value);
    if (error) setError('');
  };

  const validateCode = () => {
    if (!code) {
      setError('Please enter verification code');
      return false;
    }
    if (code.length !== 6) {
      setError('Please enter complete 6-digit code');
      return false;
    }
    return true;
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert(
        'Code Sent',
        'A new verification code has been sent to your email.',
      );
      setCode('');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <VerifyOTPComponent
      code={code}
      error={error}
      isVerifying={isVerifying}
      isResending={isResending}
      handleCodeChange={handleCodeChange}
      handleVerify={handleVerify}
      handleResendCode={handleResendCode}
    />
  );
};

export default VerifyOTPContainer;
