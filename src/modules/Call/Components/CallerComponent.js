import React from 'react';
import { KeyboardAvoidingView, SafeAreaView, StyleSheet } from 'react-native';
import CallLayout from '../../../components/Call/CallLayout';
import CallerContainer from '../Containers/CallerContainer';

export default function CallerComponent() {
  const {
    localStream,
    remoteStream,
    callStarted,
    muteMic,
    startCall,
    endCall,
    mute,
  } = CallerContainer();

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
        <CallLayout
          localStream={localStream}
          remoteStream={remoteStream}
          callStarted={callStarted}
          onPressCall={startCall}
          onPressEndCall={endCall}
          onPressMic={mute}
          isMicOn={muteMic}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
