import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, View, StyleSheet } from 'react-native';
import { RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import CallLayout from './CallLayout';
import { createPeerConnection, getLocalStream } from '../../configs/webrtc';
import { getSocket } from '../../configs/socket';
import useAuthStore from '../../hooks/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export default function ReceiverScreen() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [offer, setOffer] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const pcRef = useRef(null);
  const socket = getSocket();
  const { user } = useAuthStore();
  const navigation = useNavigation();

  const callerIdRef = useRef(null);

  useEffect(() => {
    socket.emit('register', { id: user.id, role: user.role });
    console.log('Admin or Receiver Registered:', user);

    socket.on('signal', ({ data, fromUserId }) => {
      if (data.type === 'offer') {
        setOffer({ sdp: data, from: fromUserId });
        callerIdRef.current = fromUserId;
      } else if (data.candidate) {
        pcRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else if (data.type === 'call-ended') {
        console.log('Call ended by caller');
        endCall(false);
      }
    });

    return () => {
      socket.off('signal');
      pcRef.current?.close();
    };
  }, []);

  const answerCall = async () => {
    if (!offer) return;
    console.log('Receive Offer', offer);

    const stream = await getLocalStream();
    console.log('Local Stream', stream.id);
    setLocalStream(stream);

    const pc = createPeerConnection(setRemoteStream);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('signal', {
          data: { candidate: event.candidate },
          targetUserId: callerIdRef.current,
        });
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('signal', {
      data: answer,
      targetUserId: callerIdRef.current,
    });

    setCallStarted(true);
  };

  const endCall = (sendSignal = true) => {
    console.log('Ending call...', { sendSignal });

    try {
      if (sendSignal && callerIdRef.current) {
        socket.emit('signal', {
          data: { type: 'call-ended' },
          targetUserId: callerIdRef.current,
        });
      }

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }

      setCallStarted(false);

      console.log('Navigating back to ScreenBottomTabs');
      navigation.replace('ScreenBottomTabs');
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.container}>
        <CallLayout
          localStream={localStream}
          remoteStream={remoteStream}
          callStarted={callStarted}
          onPressCall={answerCall}
          onPressEndCall={endCall}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
