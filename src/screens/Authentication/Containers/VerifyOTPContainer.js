import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import axios from 'axios';
import Config from '../../../configs/config';
import useAuthStore from '../../../hooks/auth/useAuthStore';
import VerifyOTPComponent from '../Components/VerifyOTPComponent';
import VerifyOTPActions from '../Stores/VerifyOTPActions';

const VerifyOTPContainer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { login } = useAuthStore();
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

  const handleVerify = async () => {
    if (!validateCode()) return;

    setIsVerifying(true);
    setError('');

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        otp: code,
      };

      const response = await axios.post(
        `${Config.API_URL}/api/verify-otp`,
        payload,
      );
      const { access_token, user } = response.data;

      await login({ access_token, user });

      navigation.replace('ScreenBottomTabs');
    } catch (err) {
      console.error('OTP verification failed:', err);
      setError(
        err.response?.data?.message || 'Verification failed. Please try again.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert(
        'Code Sent',
        'A new verification code has been sent to your email.',
        [{ text: 'OK' }],
      );
      setCode('');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
      console.error('Resend failed:', err);
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
