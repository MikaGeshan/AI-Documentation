import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, SafeAreaView, StyleSheet } from 'react-native';
import { RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import CallLayout from './CallLayout';
import { createPeerConnection, getLocalStream } from '../../configs/webrtc';
import useAuthStore from '../../hooks/useAuthStore';
import { getSocket } from '../../configs/socket';
import { useNavigation } from '@react-navigation/native';

export default function CallerScreen() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const navigation = useNavigation();
  const pcRef = useRef(null);
  const socket = getSocket();
  const { user } = useAuthStore();

  const targetUserIdRef = useRef(null);

  useEffect(() => {
    socket.emit('register', { id: user.id, role: user.role });
    console.log('User or Caller Registered:', user);

    socket.on('signal', async ({ data, fromUserId }) => {
      if (data.type === 'answer') {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(data),
        );
        targetUserIdRef.current = fromUserId;
      } else if (data.candidate) {
        await pcRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
      } else if (data.type === 'call-ended') {
        console.log('Call ended by remote peer');
        endCall(false);
      }
    });

    return () => {
      socket.off('signal');
      pcRef.current?.close();
    };
  }, []);

  const startCall = async () => {
    const stream = await getLocalStream();
    setLocalStream(stream);
    console.log('Local Stream', stream.id);

    const pc = createPeerConnection(setRemoteStream);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('signal', {
          data: { candidate: event.candidate },
          targetUserId: targetUserIdRef.current,
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('signal', {
      data: offer,
    });

    setCallStarted(true);
  };

  const endCall = (sendSignal = true) => {
    console.log('Send signal to remote peer?', sendSignal);
    console.log('Current target user ID:', targetUserIdRef.current);

    try {
      if (sendSignal && targetUserIdRef.current) {
        console.log('Sending "call-ended" signal to:', targetUserIdRef.current);
        socket.emit('signal', {
          data: { type: 'call-ended' },
          targetUserId: targetUserIdRef.current,
        });
      } else if (sendSignal) {
        console.warn(
          'Tried to send "call-ended", but targetUserIdRef is null!',
        );
      }

      if (pcRef.current) {
        console.log('Closing peer connection...');
        pcRef.current.close();
        pcRef.current = null;
      } else {
        console.log('Peer connection was already null.');
      }

      if (localStream) {
        console.log('Stopping local stream tracks...');
        localStream.getTracks().forEach(track => {
          console.log(`Stopping local track: ${track.kind}`);
          track.stop();
        });
        setLocalStream(null);
      } else {
        console.log('No local stream to stop.');
      }

      if (remoteStream) {
        console.log('Stopping remote stream tracks...');
        remoteStream.getTracks().forEach(track => {
          console.log(`Stopping remote track: ${track.kind}`);
          track.stop();
        });
        setRemoteStream(null);
      } else {
        console.log('No remote stream to stop.');
      }

      setCallStarted(false);

      navigation.replace('ScreenBottomTabs');
    } catch (error) {
      console.error('Error in endCall:', error);
    }
  };

  const toggleMic = () => {
    const enabled = !isMicMuted;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
    setIsMicMuted(!enabled);
  };

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
      <KeyboardAvoidingView style={styles.safeContainer}>
        <CallLayout
          localStream={localStream}
          remoteStream={remoteStream}
          callStarted={callStarted}
          onPressCall={startCall}
          onPressEndCall={endCall}
          onPressMic={toggleMic}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
