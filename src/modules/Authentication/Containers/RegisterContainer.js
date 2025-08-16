import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import Config from '../../../configs/config';
import RegisterComponent from '../Components/RegisterComponent';
import { RegisterActions } from '../Stores/RegisterActions';

const RegisterContainer = () => {
  const navigation = useNavigation();

  const {
    formData,
    errors,
    setFormData,
    validateForm,
    resetForm,
    setErrors,
    showPassword,
    togglePassword,
    showConfirmPassword,
    setShowConfirmPassword,
    showSuccessDialog,
    setShowSuccessDialog,
    showErrorDialog,
    setShowErrorDialog,
    isLoading,
    setIsLoading,
  } = RegisterActions();

  useEffect(() => {
    let timer;
    if (showSuccessDialog) {
      timer = setTimeout(() => {
        setShowSuccessDialog(false);
        resetForm();
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        });

        navigation.replace('Verify', { formData: { email: formData.email } });
      }, 3000);
    }

    return () => clearTimeout(timer);
  }, [
    setShowSuccessDialog,
    showSuccessDialog,
    resetForm,
    setFormData,
    navigation,
    formData.email,
  ]);

  const handleRegistrationError = data => {
    const errorMessage =
      data?.message || 'Registration failed. Please try again.';
    Alert.alert('Registration Failed', errorMessage);
  };

  const handleRegister = async () => {
    setErrors({});
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${Config.API_URL}/api/register`,
        {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      if (response?.status === 200 || response?.status === 201) {
        setShowSuccessDialog(true);
      } else {
        handleRegistrationError(response?.data);
      }
    } catch (error) {
      console.log('Register error:', error.response?.data || error.message);

      const message =
        error.response?.data?.message ||
        'Network error. Please check your connection.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const signInLink = () => navigation.navigate('Login');

  return (
    <RegisterComponent
      formData={formData}
      errors={errors}
      setFormData={setFormData}
      showPassword={showPassword}
      togglePassword={togglePassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      showSuccessDialog={showSuccessDialog}
      showErrorDialog={showErrorDialog}
      isLoading={isLoading}
      handleRegister={handleRegister}
      signInLink={signInLink}
      setShowSuccessDialog={setShowSuccessDialog}
      setShowErrorDialog={setShowErrorDialog}
      navigation={navigation}
    />
  );
};

export default RegisterContainer;
