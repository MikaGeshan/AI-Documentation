import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';

import InputText from '../../components/Inputs/InputText';
import Button from '../../components/Buttons/Button';
import Hyperlink from '../../components/Buttons/Hyperlink';
import Icon from '../../components/Icons/Icon';
import SuccessDialog from '../../components/Alerts/SuccessDialog';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { signInWithGoogle } from '../../services/googleAuthService';

const LoginScreen = ({}) => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    emailOrName: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    emailOrName: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isValidEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
    const { access_token, user } = data;

    try {
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setErrors({ emailOrName: '', password: '' });
      setShowSuccessDialog(true);

      setTimeout(() => {
        setShowSuccessDialog(false);
        navigation.replace('ScreenBottomTabs');
      }, 2000);
    } catch (e) {
      console.error('Gagal menyimpan token:', e);
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

      const response = await axios.post(`${API_URL}/api/login`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log(response.data);

      handleSuccessfulLogin(response.data);
    } catch (error) {
      console.error('Login error:', error);

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

  const registerLink = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'This feature will be available soon. Please contact support if you need help.',
    );
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#fff',
    },
    keyboardContainer: {
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    dialogContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    formContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingVertical: 40,
      justifyContent: 'center',
      minHeight: '100%',
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
      color: '#1F2937',
    },
    subtitle: {
      fontSize: 18,
      color: '#6B7280',
      textAlign: 'center',
    },
    inputGroup: {
      width: '100%',
      marginBottom: 20,
    },
    label: {
      marginBottom: 8,
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
    },
    separatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 24,
    },

    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#E5E7EB',
      marginHorizontal: 8,
    },

    separatorText: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
    },

    googleButtonContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },

    textInput: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      fontSize: 16,
      backgroundColor: '#F9FAFB',
    },
    inputError: {
      borderColor: '#EF4444',
      backgroundColor: '#FEF2F2',
    },
    errorText: {
      marginTop: 6,
      color: '#EF4444',
      fontSize: 14,
      fontWeight: '500',
    },
    passwordContainer: {
      position: 'relative',
    },
    eyeIconContainer: {
      position: 'absolute',
      right: 16,
      top: 16,
      zIndex: 1,
      padding: 4,
    },
    forgotPasswordContainer: {
      alignItems: 'flex-end',
      marginBottom: 24,
    },
    signUpContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingTop: 20,
    },
    signUpText: {
      fontSize: 16,
      marginRight: 6,
      color: '#6B7280',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {showSuccessDialog && (
        <View style={styles.dialogContainer}>
          <SuccessDialog
            message="Welcome back!"
            onHide={() => setShowSuccessDialog(false)}
          />
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Let's Sign you in</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Username</Text>
              <InputText
                placeholder="Enter your email or username"
                autoCapitalize="none"
                autoCorrect={false}
                value={formData.emailOrName}
                onChangeText={value => updateFormData('emailOrName', value)}
                style={[
                  styles.textInput,
                  errors.emailOrName && styles.inputError,
                ]}
                returnKeyType="next"
                keyboardType="email-address"
              />
              {errors.emailOrName ? (
                <Text style={styles.errorText}>{errors.emailOrName}</Text>
              ) : null}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <InputText
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={formData.password}
                  onChangeText={value => updateFormData('password', value)}
                  style={[
                    styles.textInput,
                    errors.password && styles.inputError,
                  ]}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={showPassword ? 'Eye' : 'EyeOff'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>
            <View style={styles.forgotPasswordContainer}>
              <Hyperlink
                text="Forgot Password?"
                onPress={handleForgotPassword}
              />
            </View>
            <Button
              text={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
            />
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Or Sign In With</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.googleButtonContainer}>
              <GoogleSigninButton
                onPress={() =>
                  signInWithGoogle({
                    navigation,
                    handleSuccessfulLogin,
                  })
                }
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
              />
            </View>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account?</Text>
              <Hyperlink text="Register Now!" onPress={registerLink} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
