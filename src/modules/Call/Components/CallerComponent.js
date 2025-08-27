import React from 'react';
import { KeyboardAvoidingView, SafeAreaView, StyleSheet } from 'react-native';
import CallerContainer from '../Containers/CallerContainer';

export default function CallerComponent() {
  const styles = StyleSheet.create({
    safeContainer: {
      flex: 1,
    },
    keyboardContainer: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView style={styles.keyboardContainer}>
        <CallerContainer />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
