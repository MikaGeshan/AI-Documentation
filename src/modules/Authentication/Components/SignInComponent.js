import React from 'react';
import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import InputText from '../../../components/Inputs/InputText';
import Button from '../../../components/Buttons/Button';
import Hyperlink from '../../../components/Buttons/Hyperlink';
import { Icon } from '../../../components/Icons/Icon';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';

const SignInComponent = ({
  formData,
  errors,
  showPassword,
  isLoading,
  updateFormData,
  setShowPassword,
  handleLogin,
  navigateToRegister,
}) => {
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
      backgroundColor: 'rgba(0,0,0,0.4)',
      zIndex: 999,
      elevation: 999,
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
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email or Username</Text>
                <InputText
                  placeholder="Enter your email or username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={formData?.emailOrName || ''}
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
              <Button
                text={isLoading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                disabled={isLoading}
              />
            </>
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account?</Text>
              <Hyperlink text="Register Now!" onPress={navigateToRegister} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignInComponent;
