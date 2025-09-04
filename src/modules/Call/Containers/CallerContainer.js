import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import { createPeerConnection, getLocalStream } from '../../../App/WebRTC';
import { initializeSocket, disconnectSocket } from '../../../App/Network';
import SignInActions from '../../Authentication/Stores/SignInActions';
import { CallerAction } from '../Stores/CallerAction';
import CallLayout from '../../../components/Call/CallLayout';

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
  const socketRef = useRef(null);
  const targetUserIdRef = useRef(null);

  const { user } = SignInActions();
  const navigation = useNavigation();

  useEffect(() => {
    let active = true;

    const setupSocket = async () => {
      const socket = await initializeSocket();
      if (!socket || !active) return;

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
        setSocketReady(true);

        // Register user
        if (user?.id && user?.role) {
          socket.emit('register', { id: user.id, role: user.role });
          console.log('[Socket] Caller Registered:', user);
        }
      });

      socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
        setSocketReady(false);
      });

      socket.on('signal', async ({ data, fromUserId }) => {
        console.log('[Socket] Signal received:', data, 'from', fromUserId);

        if (data.type === 'answer') {
          try {
            await pcRef.current?.setRemoteDescription(
              new RTCSessionDescription(data),
            );
            targetUserIdRef.current = fromUserId;
            console.log('[Socket] Remote description set (answer)');
          } catch (err) {
            console.error('[Socket] Failed to set remote description:', err);
          }
        } else if (data.candidate) {
          try {
            await pcRef.current?.addIceCandidate(
              new RTCIceCandidate(data.candidate),
            );
            console.log('[Socket] ICE candidate added');
          } catch (err) {
            console.error('[Socket] Error adding ICE candidate:', err);
          }
        } else if (data.type === 'call-ended') {
          console.log('[Socket] Call ended by remote');
          endCall(false);
        }
      });
    };

    setupSocket();

    return () => {
      active = false;
      cleanup(); // cleanup everything when component unmounts
    };
  }, [user]);

  const cleanup = () => {
    console.log('[Cleanup] Cleaning up resources...');
    try {
      // close peer connection
      pcRef.current?.close();
      pcRef.current = null;

      // stop media tracks
      localStream?.getTracks().forEach(track => track.stop());
      setLocalStream(null);

      remoteStream?.getTracks().forEach(track => track.stop());
      setRemoteStream(null);

      // clear socket
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('signal');
        disconnectSocket();
        socketRef.current = null;
      }

      setCallStarted(false);
      setSocketReady(false);
    } catch (err) {
      console.error('[Cleanup] Error:', err);
    }
  };

  const startCall = async () => {
    if (!socketReady || !socketRef.current) {
      console.warn('[Call] Socket not ready yet');
      return;
    }

    console.log('[Call] Starting call...');
    const stream = await getLocalStream();
    setLocalStream(stream);

    const pc = createPeerConnection(setRemoteStream);
    pcRef.current = pc;

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log('[Call] Track added:', track.kind);
    });

    pc.onicecandidate = event => {
      if (event.candidate) {
        socketRef.current.emit('signal', {
          data: { candidate: event.candidate },
          targetUserId: targetUserIdRef.current,
        });
        console.log('[Call] Sent ICE candidate');
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('[Call] Local description set (offer)');

    socketRef.current.emit('signal', { data: offer });
    console.log('[Call] Offer sent to signaling server');

    setCallStarted(true);
  };

  const mute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setMuteMic(newState);
        console.log(`[Call] Mic ${newState ? 'unmuted' : 'muted'}`);
      }
    }
  };

  const endCall = (sendSignal = true) => {
    console.log('[Call] Ending call, sendSignal:', sendSignal);

    try {
      if (sendSignal && socketRef.current && targetUserIdRef.current) {
        socketRef.current.emit('signal', {
          data: { type: 'call-ended' },
          targetUserId: targetUserIdRef.current,
        });
        console.log('[Call] Call-ended signal sent');
      }
    } catch (err) {
      console.error('[Call] Error sending end signal:', err);
    }

    cleanup();

    navigation.replace('ScreenBottomTabs');
  };

  if (!socketReady) {
    console.log('[Socket] Waiting for socket to be ready...');
    return null;
  }

  return (
    <CallLayout
      localStream={localStream}
      remoteStream={remoteStream}
      callStarted={callStarted}
      isMicOn={!muteMic}
      onPressMic={mute}
      onPressCall={startCall}
      onPressEndCall={endCall}
      role={user.role}
    />
  );
}
