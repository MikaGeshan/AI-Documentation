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
import Hyperlink from '../../components/Others/Hyperlink';
import Icon from '../../components/Icons/Icon';

const RegisterScreen = () => {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!name) {
      setNameError('Name is required');
      valid = false;
    }

    if (!email) {
      setEmailError('Email is required');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    }

    if (!valid) return;

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.replace('ScreenBottomTabs');
      } else {
        Alert.alert('Registration Failed', data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Register error:', error);
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
    scrollContainer: {
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
    signInContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    signInText: {
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
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <InputText
                placeholder="Enter Your Name"
                value={name}
                onChangeText={setName}
                style={[styles.textInput, nameError && styles.inputError]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <InputText
                placeholder="Enter Your Email"
                value={email}
                autoCapitalize="none"
                onChangeText={setEmail}
                style={[styles.textInput, emailError && styles.inputError]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <InputText
                  placeholder="Enter Your Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <InputText
                  placeholder="Confirm Password"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.textInput,
                    confirmPasswordError && styles.inputError,
                  ]}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? 'Eye' : 'EyeOff'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Button text="Create New Account" onPress={handleRegister} />
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account?</Text>
              <Hyperlink
                text="Sign In Now!"
                onPress={() => navigation.navigate('Login')}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
