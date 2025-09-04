import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import { createPeerConnection, getLocalStream } from '../../../App/WebRTC';
import { initializeSocket, disconnectSocket } from '../../../App/Network';
import SignInActions from '../../Authentication/Stores/SignInActions';
import { ReceiverAction } from '../Stores/ReceiverAction';
import CallLayout from '../../../components/Call/CallLayout';

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
    let active = true;

    const setupSocket = async () => {
      const socket = await initializeSocket();
      if (!socket || !active) return;

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
        setSocketReady(true);

        socket.emit('register', { id: user.id, role: user.role });
        console.log('[Socket] Receiver Registered:', user);
      });

      socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
        setSocketReady(false);
      });

      socket.on('signal', async ({ data, fromUserId }) => {
        if (data.type === 'offer') {
          callerIdRef.current = fromUserId;

          if (!pcRef.current) {
            const pc = createPeerConnection(setRemoteStream);
            pcRef.current = pc;

            pc.onicecandidate = event => {
              if (event.candidate) {
                socket.emit('signal', {
                  data: { candidate: event.candidate },
                  targetUserId: callerIdRef.current,
                });
              }
            };
          }

          console.log('[Receiver] Answering offer...');

          try {
            const stream = await getLocalStream();
            setLocalStream(stream);

            stream
              .getTracks()
              .forEach(track => pcRef.current.addTrack(track, stream));

            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(data),
            );
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);

            socket.emit('signal', {
              data: answer,
              targetUserId: callerIdRef.current,
            });

            setCallStarted(true);
            console.log('[Receiver] Answer sent to caller');
          } catch (err) {
            console.error('[Receiver] Failed to auto-answer:', err);
          }
        } else if (data.candidate) {
          try {
            await pcRef.current?.addIceCandidate(
              new RTCIceCandidate(data.candidate),
            );
            console.log('[Receiver] ICE candidate added');
          } catch (err) {
            console.error('[Receiver] Error adding ICE candidate:', err);
          }
        } else if (data.type === 'call-ended') {
          endCall(false);
        }
      });
    };

    setupSocket();

    return () => {
      active = false;
      socketRef.current?.off('connect');
      socketRef.current?.off('disconnect');
      socketRef.current?.off('signal');
      disconnectSocket();

      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [user]);

  const answerCall = async () => {
    if (!socketReady || !offer) return;

    const socket = socketRef.current;
    console.log('[Receiver] Received Offer:', offer);

    const stream = await getLocalStream();
    setLocalStream(stream);

    // Add local tracks
    stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

    await pcRef.current.setRemoteDescription(
      new RTCSessionDescription(offer.sdp),
    );
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);

    socket.emit('signal', {
      data: answer,
      targetUserId: callerIdRef.current,
    });

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
    <CallLayout
      localStream={localStream}
      remoteStream={remoteStream}
      callStarted={callStarted}
      muteMic={muteMic}
      onAnswerCall={offer ? answerCall : null}
      onToggleMic={mute}
      onEndCall={endCall}
      socketReady={socketReady}
      role={user.role}
    />
  );
}
