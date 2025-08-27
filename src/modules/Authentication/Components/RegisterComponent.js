import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Icon } from '../../../components/Icons/Icon';
import SuccessDialog from '../../../components/Alerts/SuccessDialog';
import InputText from '../../../components/Inputs/InputText';
import Button from '../../../components/Buttons/Button';
import Hyperlink from '../../../components/Buttons/Hyperlink';
import ErrorDialog from '../../../components/Alerts/ErrorDialog';

const RegisterComponent = ({
  formData,
  errors,
  setFormData,
  showPassword,
  togglePassword,
  showConfirmPassword,
  setShowConfirmPassword,
  showSuccessDialog,
  setShowSuccessDialog,
  showErrorDialog,
  setShowErrorDialog,
  isLoading,
  handleRegister,
  signInLink,
}) => {
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      paddingTop: Platform.select({
        ios: 20,
        android: 20,
      }),
    },
    keyboardContainer: {
      flex: 1,
      paddingTop: Platform.select({
        ios: 20,
        android: 20,
      }),
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
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
    },
    errorText: {
      marginTop: 6,
      color: '#DC2626',
      fontSize: 13,
      fontWeight: '500',
    },
    passwordWrapper: {
      position: 'relative',
      width: '100%',
      justifyContent: 'center',
    },
    eyeButton: {
      padding: 6,
      zIndex: 1,
      position: 'absolute',
      right: 12,
      top: '40%',
      transform: [{ translateY: -11 }],
    },
    signInLinkContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    signInText: {
      fontSize: 15,
      color: '#6B7280',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in the details below</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <InputText
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={value => setFormData('name', value)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <InputText
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={value => setFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <InputText
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={value => setFormData('password', value)}
              />
              <TouchableOpacity
                onPress={togglePassword}
                style={styles.eyeButton}
              >
                <Icon
                  name={showPassword ? 'Eye' : 'EyeOff'}
                  size={22}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordRow}>
              <InputText
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                value={formData.confirmPassword}
                onChangeText={value => setFormData('confirmPassword', value)}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(prev => !prev)}
                style={styles.eyeButton}
              >
                <Icon
                  name={showConfirmPassword ? 'Eye' : 'EyeOff'}
                  size={22}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          <Button
            text={isLoading ? 'Loading...' : 'Register'}
            onPress={handleRegister}
            disabled={isLoading}
          />

          <View style={styles.signInLinkContainer}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <Hyperlink text={' Sign In'} onPress={signInLink} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterComponent;
