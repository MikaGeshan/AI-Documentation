import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import ButtonCall from '../../components/Buttons/ButtonCall';

const CallLayout = ({
  localStream,
  remoteStream,
  children,
  onCallColor,
  onPressCall,
  onPressOutput,
  onPressMute,
}) => {
  useEffect(() => {
    console.log('📹 Local Stream:', localStream);
    console.log('📺 Remote Stream:', remoteStream);
  }, [localStream, remoteStream]);

  const renderStream = (stream, style, isLocal = false) => {
    try {
      const streamURL = stream?.toURL?.();
      console.log(`${isLocal ? 'Local' : 'Remote'} streamURL:`, streamURL);
      if (!streamURL) return null;

      return (
        <RTCView
          key={streamURL}
          streamURL={streamURL}
          style={[style]}
          objectFit="cover"
          mirror={isLocal}
        />
      );
    } catch (error) {
      console.warn('⚠️ RTCView error:', error);
      return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    remote: {
      ...StyleSheet.absoluteFillObject,
    },
    local: {
      position: 'absolute',
      top: 40,
      right: 20,
      width: 120,
      height: 180,
      borderWidth: 2,
      borderColor: '#fff',
      borderRadius: 8,
      overflow: 'hidden',
      zIndex: 10,
    },
    bottomArea: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    buttonContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonSpacing: {
      marginHorizontal: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {remoteStream && renderStream(remoteStream, styles.remote)}

      {localStream && renderStream(localStream, styles.local, true)}

      <KeyboardAvoidingView
        style={styles.bottomArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.buttonContainer}>
          <View style={styles.buttonSpacing}>
            <ButtonCall
              name="Mic"
              backgroundColor="rgba(0, 0, 0, 0.4)"
              onPress={onPressMute}
            />
          </View>
          <View style={styles.buttonSpacing}>
            <ButtonCall
              name="Phone"
              backgroundColor={onCallColor}
              onPress={onPressCall}
            />
          </View>
          <View style={styles.buttonSpacing}>
            <ButtonCall
              name="Volume2"
              backgroundColor="rgba(0, 0, 0, 0.4)"
              onPress={onPressOutput}
            />
          </View>
        </View>

        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CallLayout;
