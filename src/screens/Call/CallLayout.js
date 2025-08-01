import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

const CallLayout = ({ localStream, remoteStream, children }) => {
  useEffect(() => {
    console.log('📹 Local Stream:', localStream);
    console.log('📺 Remote Stream:', remoteStream);
  }, [localStream, remoteStream]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    remote: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    local: {
      position: 'absolute',
      width: 120,
      height: 180,
      top: 30,
      right: 20,
      borderWidth: 2,
      borderColor: '#fff',
    },
  });

  const renderStream = (stream, style, isLocal = false) => {
    try {
      const streamURL = stream?.toURL?.();
      console.log(`${isLocal ? 'Local' : 'Remote'} streamURL:`, streamURL);
      if (!streamURL) return null;

      return (
        <RTCView
          key={streamURL}
          streamURL={streamURL}
          style={[style, { backgroundColor: isLocal ? 'green' : 'red' }]}
          objectFit="cover"
          mirror={isLocal}
        />
      );
    } catch (error) {
      console.warn('⚠️ RTCView error:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      {remoteStream ? renderStream(remoteStream, styles.remote, false) : null}
      {localStream ? renderStream(localStream, styles.local, true) : null}
      {children}
    </View>
  );
};

export default CallLayout;
