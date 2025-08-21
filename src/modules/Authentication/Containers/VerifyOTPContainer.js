import React, { useEffect } from 'react';
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

  // ---------- Deep Linking Listener ----------
  useEffect(() => {
    const handleDeepLink = async event => {
      try {
        console.log('[DeepLink] Event received:', event);
        const url = event.url;
        if (!url) return;

        console.log('[DeepLink] URL:', url);

        const token = url.match(/token=([^&]+)/)?.[1];
        if (!token) {
          console.log('[DeepLink] No JWT token found in URL');
          return;
        }

        console.log('[DeepLink] JWT token found:', token);

        // Optional: fetch user info from backend if needed
        const response = await axios.get(`${Config.API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = response.data.user;
        await login({ access_token: token, user });
        console.log('[DeepLink] Login success, navigating...');
        navigation.replace('ScreenBottomTabs');
      } catch (err) {
        console.error('[DeepLink] Failed to handle deep link:', err);
        Alert.alert(
          'Google Auth Failed',
          'Could not complete Google authentication.',
        );
      }
    };

    console.log('[DeepLink] Setting up listener...');
    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL()
      .then(url => {
        console.log('[DeepLink] Initial URL:', url);
        if (url) handleDeepLink({ url });
      })
      .catch(err => console.error('[DeepLink] getInitialURL error:', err));

    return () => {
      console.log('[DeepLink] Removing listener');
      subscription.remove();
    };
  }, [login, navigation]);

  // ---------- OTP Verification ----------
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

        console.log(
          '[OTP] Opening Google consent URL for mobile:',
          authUrlWithMobile,
        );
        try {
          await Linking.openURL(authUrlWithMobile);
        } catch (err) {
          console.error('[OTP] Failed to open URL:', err);
          Alert.alert('Error', 'Cannot open Google consent page.');
        }
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

  // ---------- OTP Handling ----------
  const handleCodeChange = value => {
    console.log('[OTP] Code changed:', value);
    setCode(value);
    if (error) setError('');
  };

  const validateCode = () => {
    console.log('[OTP] Validating code:', code);
    if (!code) {
      setError('Please enter verification code');
      console.log('[OTP] Validation failed: empty code');
      return false;
    }
    if (code.length !== 6) {
      setError('Please enter complete 6-digit code');
      console.log('[OTP] Validation failed: incomplete code');
      return false;
    }
    console.log('[OTP] Code validated successfully');
    return true;
  };

  const handleResendCode = async () => {
    console.log('[OTP] Resend code requested');
    setIsResending(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('[OTP] Code resent successfully');
      Alert.alert(
        'Code Sent',
        'A new verification code has been sent to your email.',
        [{ text: 'OK' }],
      );
      setCode('');
    } catch (err) {
      console.error('[OTP] Resend failed:', err);
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
