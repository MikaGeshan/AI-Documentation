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
import Hyperlink from '../../components/Buttons/Hyperlink';
import { Icon } from '../../components/Icons/Icon';
import SuccessDialog from '../../components/Alerts/SuccessDialog';
import axios from 'axios';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { signInWithGoogle } from '../../services/googleAuthService';
import { useForm } from '../../hooks/useForm';
import { useVisiblePassword } from '../../hooks/useVisiblePassword';
import Config from '../../configs/config';

const RegisterScreen = () => {
  const navigation = useNavigation();

  const {
    formData,
    errors,
    updateFormData,
    validateForm,
    setFormData,
    setErrors,
  } = useForm();

  const [showPassword, togglePassword] = useVisiblePassword();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccessfulRegistration = () => {
    setShowSuccessDialog(true);

    setTimeout(() => {
      setShowSuccessDialog(false);

      setFormData({
        name: '',
        email: '',
        password: '',
      });

      navigation.replace('Verify');
    }, 3000);
  };

  const handleRegistrationError = data => {
    const errorMessage =
      data?.message || 'Registration failed. Please try again.';
    Alert.alert('Registration Failed', errorMessage);
  };

  const handleRegister = async () => {
    setErrors({});
    if (!validateForm()) return;

    setIsLoading(true);

    console.log('API_URL:', Config.API_URL);

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

      console.log(response.data);

      if (response.status === 200 || response.status === 201) {
        handleSuccessfulRegistration();
      } else {
        handleRegistrationError(response.data);
      }
    } catch (error) {
      console.error('Register error:', error);
      if (error.response && error.response.data) {
        handleRegistrationError(error.response.data);
      } else {
        Alert.alert(
          'Error',
          'Network error. Please check your connection and try again.',
        );
      }
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
        ios: 20,
        android: 20,
      }),
      paddingBottom: 20,
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
                  onPress={togglePassword}
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
                    handleSuccessfulRegistration,
                  })
                }
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
              />
            </View>

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
