import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

const VideoView = ({ stream, style, mirror = false }) => {
  if (!stream || !stream.toURL) {
    console.warn('VideoView: Invalid or missing stream');
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    video: {
      width: '100%',
      height: '100%',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <RTCView
        key={stream.id || stream.toURL()}
        streamURL={stream.toURL()}
        style={styles.video}
        objectFit="cover"
        mirror={mirror}
        zOrder={0}
      />
    </View>
  );
};

export default VideoView;
