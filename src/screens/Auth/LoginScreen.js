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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';

import InputText from '../../components/Inputs/InputText';
import Button from '../../components/Buttons/Button';
import Hyperlink from '../../components/Others/Hyperlink';
import Icon from '../../components/Icons/Icon';

const LoginScreen = () => {
  const navigation = useNavigation();

  const [emailOrName, setEmailOrName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailOrNameError, setEmailOrNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const isEmailOrNameEmpty = !emailOrName.trim();
    const isPasswordEmpty = !password.trim();

    setEmailOrNameError(false);
    setPasswordError(false);

    if (isEmailOrNameEmpty || isPasswordEmpty) {
      if (isEmailOrNameEmpty) setEmailOrNameError(true);
      if (isPasswordEmpty) setPasswordError(true);

      Alert.alert(
        'Validation Error',
        'Please enter Email or Username, and Password',
      );
      return;
    }

    const payload = {
      password,
      ...(emailOrName.includes('@')
        ? { email: emailOrName }
        : { name: emailOrName }),
    };

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.replace('ScreenBottomTabs');
      } else {
        setEmailOrNameError(true);
        setPasswordError(true);
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#fff',
    },
    keyboardContainer: {
      flex: 1,
    },
    formContainer: {
      flex: 1,
      padding: 16,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    inputGroup: {
      width: '100%',
      marginBottom: 12,
    },
    label: {
      marginBottom: 6,
      fontSize: 14,
      fontWeight: '500',
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#E6E4E2',
      borderRadius: 8,
    },
    inputError: {
      borderColor: 'red',
    },
    errorText: {
      marginTop: 4,
      color: 'red',
      fontSize: 12,
    },
    hyperlinkContainer: {
      marginTop: 24,
      alignItems: 'center',
    },
    signUpContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
    },
    signUpText: {
      fontSize: 14,
      marginRight: 4,
    },
    passwordContainer: {
      position: 'relative',
    },
    eyeIconContainer: {
      position: 'absolute',
      right: 12,
      top: 16,
      zIndex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Let's Sign you in</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address or Username</Text>
            <InputText
              placeholder="Enter Your Email or Username"
              autoCapitalize="none"
              autoCorrect={false}
              value={emailOrName}
              onChangeText={text => {
                setEmailOrName(text);
                setEmailOrNameError(false);
              }}
              style={[styles.textInput, emailOrNameError && styles.inputError]}
            />
            {emailOrNameError && (
              <Text style={styles.errorText}>
                Email or Username is required
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <InputText
                placeholder="Enter Your Password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setPasswordError(false);
                }}
                style={[styles.textInput, passwordError && styles.inputError]}
              />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? 'Eye' : 'EyeOff'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {passwordError && (
              <Text style={styles.errorText}>Password is required</Text>
            )}
          </View>

          <Button text="Sign In" onPress={handleLogin} />

          <View style={styles.hyperlinkContainer}>
            <Hyperlink
              text="Forgot Password?"
              onPress={() => console.log('Pressed')}
            />
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account?</Text>
              <Hyperlink
                text="Sign Up"
                onPress={() => navigation.navigate('Register')}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
