import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInputComponent,
  View,
} from 'react-native';
import React from 'react';
import InputBox from '../../components/InputBox';

const RegisterScreen = () => {
  const styles = StyleSheet.create({});

  return (
    <SafeAreaView>
      <KeyboardAvoidingView>
        <View>
          <Text>Create Account</Text>
          <InputBox />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
