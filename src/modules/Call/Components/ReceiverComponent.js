import React from 'react';
import { KeyboardAvoidingView, SafeAreaView, StyleSheet } from 'react-native';
import ReceiverContainer from '../Containers/ReceiverContainer';

export default function ReceiverComponent({ socketReady }) {
  const styles = StyleSheet.create({
    safeContainer: {
      flex: 1,
    },
    keyboardContainer: {
      flex: 1,
    },
  });

  if (!socketReady) return null;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView style={styles.keyboardContainer}>
        <ReceiverContainer />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
