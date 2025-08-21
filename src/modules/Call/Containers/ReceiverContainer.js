import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import { createPeerConnection, getLocalStream } from '../../../App/WebRTC';
import { initializeSocket } from '../../../App/Network';
import SignInActions from '../../Authentication/Stores/SignInActions';
import { ReceiverAction } from '../Stores/ReceiverAction';
import ReceiverComponent from '../Components/ReceiverComponent';

export default function ReceiverContainer() {
  const {
    localStream,
    remoteStream,
    offer,
    muteMic,
    callStarted,
    setLocalStream,
    setRemoteStream,
    setOffer,
    setMuteMic,
    setCallStarted,
  } = ReceiverAction();

  const [socketReady, setSocketReady] = useState(false);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const { user } = SignInActions();
  const navigation = useNavigation();
  const callerIdRef = useRef(null);

  useEffect(() => {
    const setupSocket = async () => {
      const socket = await initializeSocket();
      if (!socket) {
        console.error('[Socket] Failed to initialize');
        return;
      }

      socketRef.current = socket;
      setSocketReady(true);

      socket.emit('register', { id: user.id, role: user.role });
      console.log('[Socket] Receiver Registered:', user);

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
    };

    setupSocket();

    return () => {
      socketRef.current?.off('signal');
      pcRef.current?.close();
    };
  }, [user]);

  const answerCall = async () => {
    if (!socketReady) return console.warn('[Socket] Not ready');
    if (!offer) return;

    const socket = socketRef.current;
    console.log('Receive Offer', offer);

    const stream = await getLocalStream();
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

    socket.emit('signal', { data: answer, targetUserId: callerIdRef.current });
    setCallStarted(true);
  };

  const mute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setMuteMic(newState);
      }
    }
  };

  const endCall = (sendSignal = true) => {
    const socket = socketRef.current;
    if (!socket) return;

    try {
      if (sendSignal && callerIdRef.current) {
        socket.emit('signal', {
          data: { type: 'call-ended' },
          targetUserId: callerIdRef.current,
        });
      }

      pcRef.current?.close();
      pcRef.current = null;

      localStream?.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      remoteStream?.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
      setCallStarted(false);

      navigation.replace('ScreenBottomTabs');
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  return (
    <ReceiverComponent
      localStream={localStream}
      remoteStream={remoteStream}
      callStarted={callStarted}
      muteMic={muteMic}
      onAnswerCall={answerCall}
      onToggleMic={mute}
      onEndCall={endCall}
      socketReady={socketReady}
    />
  );
}
