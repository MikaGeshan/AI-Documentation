import React, { useEffect, useRef, useState } from 'react';
import { Button, View } from 'react-native';
import { RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import CallLayout from './CallLayout';
import { createPeerConnection, getLocalStream } from '../../configs/webrtc';
import useAuthStore from '../../hooks/useAuthStore';
import { getSocket } from '../../configs/socket';

export default function CallerScreen() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const pcRef = useRef(null);
  const socket = getSocket();
  const { user } = useAuthStore();

  useEffect(() => {
    socket.emit('register', { id: user.id, role: user.role });
    console.log('User or Caller Registered:', user);

    socket.on('signal', async ({ data }) => {
      if (data.type === 'answer') {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(data),
        );
      } else if (data.candidate) {
        await pcRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
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

    const pc = createPeerConnection(setRemoteStream);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('signal', {
          data: { candidate: event.candidate },
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('signal', {
      data: offer,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <CallLayout localStream={localStream} remoteStream={remoteStream} />
      <Button title="Start Call" onPress={startCall} />
    </View>
  );
}
