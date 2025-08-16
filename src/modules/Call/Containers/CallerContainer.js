import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../../App/Network';

import { useNavigation } from '@react-navigation/native';
import { RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import { createPeerConnection, getLocalStream } from '../../../configs/webrtc';
import SignInActions from '../../Authentication/Stores/SignInActions';

export default function CallerContainer() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const [muteMic, setMuteMic] = useState(true);

  const pcRef = useRef(null);
  const targetUserIdRef = useRef(null);

  const socket = getSocket();
  const { user } = SignInActions();
  const navigation = useNavigation();

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

    socket.emit('signal', { data: offer });
    setCallStarted(true);
  };

  const mute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setMuteMic(newState);
        console.log(`Microphone ${newState ? 'unmuted' : 'muted'}`);
      }
    }
  };

  const endCall = (sendSignal = true) => {
    console.log('Send signal to remote peer?', sendSignal);
    console.log('Current target user ID:', targetUserIdRef.current);

    try {
      if (sendSignal && targetUserIdRef.current) {
        socket.emit('signal', {
          data: { type: 'call-ended' },
          targetUserId: targetUserIdRef.current,
        });
      }

      pcRef.current?.close();
      pcRef.current = null;

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }

      setCallStarted(false);
      navigation.replace('ScreenBottomTabs');
    } catch (error) {
      console.error('Error in endCall:', error);
    }
  };

  return {
    localStream,
    remoteStream,
    callStarted,
    muteMic,
    startCall,
    endCall,
    mute,
  };
}
