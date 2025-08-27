import React from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import SignInComponent from '../Components/SignInComponent';
import SignInActions from '../Stores/SignInActions';
import { signInWithGoogle } from '../../../App/Google';
import Config from '../../../App/Network';
import SuccessDialog from '../../../components/Alerts/SuccessDialog';
import ErrorDialog from '../../../components/Alerts/ErrorDialog';

const SignInContainer = () => {
  const navigation = useNavigation();

  const {
    login,
    formData,
    errors,
    showPassword,
    showSuccessDialog,
    showErrorDialog,
    isLoading,
    updateFormData,
    setErrors,
    setShowPassword,
    setShowSuccessDialog,
    setShowErrorDialog,
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
    } catch (error) {
      console.error('Login handling failed:', error);
      setShowErrorDialog(true);
    }
  };

  const handleLoginError = data => {
    console.error('[handleLoginError]', data?.message || 'Login failed');
    setShowErrorDialog(true);
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
      handleLoginError(error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowErrorDialog(true);
  };

  return (
    <>
      <SignInComponent
        formData={formData}
        errors={errors}
        showPassword={showPassword}
        isLoading={isLoading}
        updateFormData={updateFormData}
        setShowPassword={setShowPassword}
        handleLogin={handleLogin}
        handleForgotPassword={handleForgotPassword}
        signInWithGoogle={() =>
          signInWithGoogle({ navigation, handleSuccessfulLogin })
        }
        navigateToRegister={() => navigation.navigate('Register')}
      />

      {showSuccessDialog && (
        <SuccessDialog
          message="Login successful!"
          visible={true}
          onHide={() => {
            setShowSuccessDialog(false);
            setTimeout(() => navigation.replace('ScreenBottomTabs'), 3000);
          }}
        />
      )}

      {showErrorDialog && (
        <ErrorDialog
          message="Login failed. Please check your credentials."
          visible={true}
          onHide={(() => setShowErrorDialog(false), 3000)}
        />
      )}
    </>
  );
};

export default SignInContainer;
