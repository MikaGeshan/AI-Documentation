import React from 'react';
import { KeyboardAvoidingView, SafeAreaView, StyleSheet } from 'react-native';
import CallLayout from '../../../components/Call/CallLayout';

export default function ReceiverComponent({
  localStream,
  remoteStream,
  callStarted,
  muteMic,
  onAnswerCall,
  onToggleMic,
  socketReady,
}) {
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
        <CallLayout
          localStream={localStream}
          remoteStream={remoteStream}
          callStarted={callStarted}
          onPressCall={onAnswerCall}
          onPressMic={onToggleMic}
          isMicOn={muteMic}
          onHideCallButton
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
