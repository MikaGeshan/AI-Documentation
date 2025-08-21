import { useEffect, useRef, useState } from 'react';
import { getSocket, initializeSocket } from '../../../App/Network';
import { useNavigation } from '@react-navigation/native';
import { RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import { createPeerConnection, getLocalStream } from '../../../App/WebRTC';
import SignInActions from '../../Authentication/Stores/SignInActions';
import CallerComponent from '../Components/CallerComponent';
import { CallerAction } from '../Stores/CallerAction';

export default function CallerContainer() {
  const {
    localStream,
    remoteStream,
    callStarted,
    muteMic,
    setLocalStream,
    setRemoteStream,
    setCallStarted,
    setMuteMic,
  } = CallerAction();

  const [socketReady, setSocketReady] = useState(false);
  const pcRef = useRef(null);
  const targetUserIdRef = useRef(null);

  const { user } = SignInActions();
  const navigation = useNavigation();

  useEffect(() => {
    let socket;
    const setupSocket = async () => {
      console.log('[Socket] Initializing...');
      socket = await initializeSocket();

      if (!socket) {
        console.error('[Socket] Failed to initialize');
        return;
      }

      console.log('[Socket] Initialized:', socket.id);
      setSocketReady(true);

      if (user?.role === 'user' || user?.role === 'admin') {
        console.log(`[Socket] Registering ${user.role} with ID:`, user.id);
        socket.emit('register', { id: user.id, role: user.role });

        socket.on('signal', async ({ data, fromUserId }) => {
          console.log('[Socket] Signal received:', data, 'from', fromUserId);

          if (data.type === 'answer') {
            console.log('[Socket] Setting remote description (answer)');
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(data),
            );
            targetUserIdRef.current = fromUserId;
          } else if (data.candidate) {
            console.log('[Socket] Adding ICE candidate');
            await pcRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate),
            );
          } else if (data.type === 'call-ended') {
            console.log('[Socket] Call ended signal received');
            endCall(false);
          }
        });
      }
    };

    setupSocket();

    return () => {
      if (socket) {
        console.log('[Socket] Cleaning up socket listeners');
        socket.off('signal');
      }
      pcRef.current?.close();
    };
  }, [user]);

  const startCall = async () => {
    const socket = getSocket();
    if (!socket) {
      console.warn('[Socket] Not ready yet');
      return;
    }

    console.log('[Call] Starting call...');
    const stream = await getLocalStream();
    setLocalStream(stream);
    console.log('[Call] Local Stream ID:', stream.id);

    const pc = createPeerConnection(setRemoteStream);
    pcRef.current = pc;

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log('[Call] Track added:', track.kind);
    });

    pc.onicecandidate = event => {
      if (event.candidate) {
        console.log('[Call] Sending ICE candidate:', event.candidate);
        socket.emit('signal', {
          data: { candidate: event.candidate },
          targetUserId: targetUserIdRef.current,
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('[Call] Local description set (offer):', offer);

    socket.emit('signal', { data: offer });
    console.log('[Call] Offer sent via socket');
    setCallStarted(true);
  };

  const mute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setMuteMic(newState);
        console.log(`[Call] Microphone ${newState ? 'unmuted' : 'muted'}`);
      }
    }
  };

  const endCall = (sendSignal = true) => {
    const socket = getSocket();
    if (!socket) {
      console.warn('[Call] Cannot end call, socket not ready');
      return;
    }

    console.log('[Call] Ending call, sendSignal:', sendSignal);

    try {
      if (sendSignal && targetUserIdRef.current) {
        console.log('[Call] Sending call-ended signal');
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
        console.log('[Call] Local stream stopped');
      }

      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
        console.log('[Call] Remote stream stopped');
      }

      setCallStarted(false);
      console.log('[Call] Call state reset');
      navigation.replace('ScreenBottomTabs');
    } catch (error) {
      console.error('[Call] Error in endCall:', error);
    }
  };

  if (!socketReady) {
    console.log('[Socket] Waiting for socket to be ready...');
    return null;
  }

  return (
    <CallerComponent
      localStream={localStream}
      remoteStream={remoteStream}
      callStarted={callStarted}
      muteMic={muteMic}
      startCall={startCall}
      endCall={endCall}
      mute={mute}
    />
  );
}
