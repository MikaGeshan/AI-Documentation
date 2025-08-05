import React from 'react';
import { View, StyleSheet } from 'react-native';
import VideoView from '../../components/Call/VideoView';

export default function CallLayout({ localStream, remoteStream }) {
  return (
    <View style={styles.container}>
      {remoteStream && (
        <VideoView stream={remoteStream} style={styles.remoteVideo} />
      )}
      {localStream && (
        <VideoView stream={localStream} mirror style={styles.localVideo} />
      )}
    </View>
  );
}

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
});
