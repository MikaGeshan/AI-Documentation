import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import InputOTP from '../../components/Inputs/InputOTP';
import Button from '../../components/Buttons/Button';
import Hyperlink from '../../components/Buttons/Hyperlink';
import { API_URL } from '@env';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VerifyOTPScreen = () => {
  const route = useRoute();
  const { formData } = route.params ?? {};

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigation = useNavigation();

  const handleCodeChange = useCallback(
    value => {
      setCode(value);
      if (error) {
        setError('');
      }
    },
    [error],
  );

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

      const response = await axios.post(`${API_URL}/api/verify-otp`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('OTP verification success:', response.data);

      const { access_token, user } = response.data;

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      navigation.replace('ScreenBottomTabs');
    } catch (err) {
      console.error('OTP verification failed:', err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Verifikasi gagal. Silakan coba lagi.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Resending code...');

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 12,
      color: '#1A1A1A',
    },
    text: {
      fontSize: 16,
      fontWeight: 500,
      textAlign: 'center',
      color: '#666',
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    buttonContainer: {
      gap: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.text}>
              Please enter the 6 digit code sent to your email
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <InputOTP
              value={code}
              onChangeText={handleCodeChange}
              error={error}
              disabled={isVerifying}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Hyperlink
              text={isResending ? 'Sending...' : 'Resend Code'}
              onPress={handleResendCode}
              disabled={isResending}
            />

            <Button
              text={isVerifying ? 'Verifying...' : 'Verify'}
              onPress={handleVerify}
              disabled={isVerifying || code.length !== 6}
              loading={isVerifying}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyOTPScreen;
