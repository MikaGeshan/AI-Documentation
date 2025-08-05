import React from 'react';
import { View, StyleSheet } from 'react-native';
import VideoView from '../../components/Call/VideoView';
import ButtonCall from '../../components/Buttons/ButtonCall';

export default function CallLayout({
  localStream,
  remoteStream,
  onPressMic,
  callStarted,
  onPressCall,
  onPressEndCall,
  onPressOutput,
}) {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
      position: 'relative',
    },
    remoteVideo: {
      flex: 1,
    },
    localVideo: {
      position: 'absolute',
      right: 16,
      bottom: 24,
      width: 120,
      height: 180,
      borderRadius: 8,
      overflow: 'hidden',
      zIndex: 10,
      borderWidth: 1,
      borderColor: 'white',
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 24,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      zIndex: 20,
    },
    buttonSpacing: {
      marginHorizontal: 8,
    },
  });

  return (
    <View style={styles.container}>
      {remoteStream && (
        <VideoView stream={remoteStream} style={styles.remoteVideo} />
      )}
      {localStream && (
        <VideoView stream={localStream} style={styles.localVideo} />
      )}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonSpacing}>
          <ButtonCall
            name="Mic"
            backgroundColor="rgba(0, 0, 0, 0.4)"
            onPress={onPressMic}
          />
        </View>
        <View style={styles.buttonSpacing}>
          <ButtonCall
            name="Phone"
            backgroundColor={callStarted ? 'red' : 'green'}
            onPress={callStarted ? onPressEndCall : onPressCall}
          />
        </View>
        {/* <View style={styles.buttonSpacing}>
          <ButtonCall
            name="Volume2"
            backgroundColor="rgba(0, 0, 0, 0.4)"
            onPress={onPressOutput}
          />
        </View> */}
      </View>
    </View>
  );
}
