import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';

import InputText from '../../components/InputText';
import Button from '../../components/Button';
import Hyperlink from '../../components/Hyperlink';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Email and Password cannot be empty');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.replace('ScreenBottomTabs');
      } else {
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
      padding: 24,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    inputTextGroupContainer: {
      width: '100%',
    },
    label: {
      marginBottom: 6,
      fontSize: 14,
      fontWeight: '500',
    },
    hyperlink: {
      textAlign: 'center',
      marginTop: 32,
      fontSize: 14,
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

          <View style={styles.inputTextGroupContainer}>
            <Text style={styles.label}>Email address or Username</Text>
            <InputText
              placeholder="Enter Your Email or Username"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputTextGroupContainer}>
            <Text style={styles.label}>Password</Text>
            <InputText
              placeholder="Enter Your Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Button text="Sign In" onPress={handleLogin} />

          <Text style={styles.hyperlink}>
            Don't have an account? <Hyperlink text="Sign Up" />
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
