import React from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import SignInComponent from '../Components/SignInComponent';
import useAuthStore from '../../../hooks/auth/useAuthStore';
import Config from '../../../configs/config';
import { signInWithGoogle } from '../../../services/googleAuthService';
import SignInActions from '../Stores/SignInActions';

const SignInContainer = () => {
  const navigation = useNavigation();
  const { login } = useAuthStore();

  const {
    formData,
    errors,
    showPassword,
    showSuccessDialog,
    isLoading,
    updateFormData,
    setErrors,
    setShowPassword,
    setShowSuccessDialog,
    setIsLoading,
    resetForm,
  } = SignInActions();

  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.emailOrName.trim()) {
      newErrors.emailOrName = 'Email or username is required';
      isValid = false;
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const createLoginPayload = () => {
    const trimmedInput = formData.emailOrName.trim();
    return {
      password: formData.password,
      ...(isValidEmail(trimmedInput)
        ? { email: trimmedInput.toLowerCase() }
        : { name: trimmedInput }),
    };
  };

  const handleSuccessfulLogin = async data => {
    try {
      const { access_token, user } = data;
      await login({ access_token, user });

      resetForm();

      setShowSuccessDialog(true);
      setTimeout(() => {
        setShowSuccessDialog(false);
        navigation.replace('ScreenBottomTabs');
      }, 3000);
    } catch (error) {
      console.error('Login handling failed:', error);
    }
  };

  const handleLoginError = data => {
    const errorMessage =
      data?.message || 'Invalid credentials. Please try again.';
    setErrors({
      emailOrName: 'Please check your credentials',
      password: 'Please check your credentials',
    });
    Alert.alert('Login Failed', errorMessage);
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const payload = createLoginPayload();
      const response = await axios.post(
        `${Config.API_URL}/api/login`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );
      handleSuccessfulLogin(response.data);
    } catch (error) {
      if (error.response && error.response.data) {
        handleLoginError(error.response.data);
      } else {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check your internet connection and try again.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'This feature will be available soon. Please contact support if you need help.',
    );
  };

  return (
    <SignInComponent
      formData={formData}
      errors={errors}
      showPassword={showPassword}
      showSuccessDialog={showSuccessDialog}
      isLoading={isLoading}
      updateFormData={updateFormData}
      setShowPassword={setShowPassword}
      setShowSuccessDialog={setShowSuccessDialog}
      handleLogin={handleLogin}
      handleForgotPassword={handleForgotPassword}
      signInWithGoogle={() =>
        signInWithGoogle({ navigation, handleSuccessfulLogin })
      }
      navigateToRegister={() => navigation.navigate('Register')}
    />
  );
};

export default SignInContainer;
