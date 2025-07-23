import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';
import InputText from '../../components/Inputs/InputText';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/Buttons/Button';
import { API_URL } from '@env';
import Hyperlink from '../../components/Buttons/Hyperlink';
import Icon from '../../components/Icons/Icon';
import SuccessDialog from '../../components/Alerts/SuccessDialog';

const RegisterScreen = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const isValidPassword = password => {
    return password.length >= 8;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSuccessfulRegistration = () => {
    setShowSuccessDialog(true);
    setTimeout(() => {
      setShowSuccessDialog(false);
      navigation.replace('Verify');
    }, 3000);
  };

  const handleRegistrationError = data => {
    const errorMessage =
      data?.message || 'Registration failed. Please try again.';
    Alert.alert('Registration Failed', errorMessage);
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        handleSuccessfulRegistration();
      } else {
        handleRegistrationError(data);
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert(
        'Error',
        'Network error. Please check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signInLink = () => {
    navigation.navigate('Login');
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
      paddingTop: Platform.select({
        ios: 60,
        android: 40,
      }),
      paddingBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
      color: '#1F2937',
    },
    subtitle: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 32,
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
    signInContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
    },
    signInText: {
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
            message="Account created successfully!"
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}> Name</Text>
              <InputText
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={value => updateFormData('name', value)}
                style={[styles.textInput, errors.name && styles.inputError]}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <InputText
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={value => updateFormData('email', value)}
                style={[styles.textInput, errors.email && styles.inputError]}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <InputText
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={value => updateFormData('password', value)}
                  style={[
                    styles.textInput,
                    errors.password && styles.inputError,
                  ]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <InputText
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  value={formData.confirmPassword}
                  onChangeText={value =>
                    updateFormData('confirmPassword', value)
                  }
                  style={[
                    styles.textInput,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={showConfirmPassword ? 'Eye' : 'EyeOff'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            <Button
              text={isLoading ? 'Creating Account...' : 'Create An Account'}
              onPress={handleRegister}
              disabled={isLoading}
            />

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account?</Text>
              <Hyperlink text="Sign In Now!" onPress={signInLink} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
