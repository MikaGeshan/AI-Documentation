import React, { useEffect, useRef, useState } from 'react';
import { Button, View } from 'react-native';
import { RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import CallLayout from './CallLayout';
import { createPeerConnection, getLocalStream } from '../../configs/webrtc';
import { getSocket } from '../../configs/socket';
import useAuthStore from '../../hooks/useAuthStore';

export default function ReceiverScreen() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [offer, setOffer] = useState(null);
  const pcRef = useRef(null);
  const socket = getSocket();
  const { user } = useAuthStore(); // user = { id: number, role: 'admin' }

  useEffect(() => {
    socket.emit('register', { id: user.id, role: user.role });
    console.log('Admin or Receiver Registered:', user);

    socket.on('signal', ({ data, fromUserId }) => {
      if (data.type === 'offer') {
        setOffer({ sdp: data, from: fromUserId });
        console.log(setOffer);
      } else if (data.candidate) {
        pcRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
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
    setLocalStream(stream);

    const pc = createPeerConnection(setRemoteStream);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('signal', {
          data: { candidate: event.candidate },
          targetUserId: offer.from,
        });
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('signal', {
      data: answer,
      targetUserId: offer.from,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <CallLayout localStream={localStream} remoteStream={remoteStream} />
      <Button title="Answer Call" onPress={answerCall} disabled={!offer} />
    </View>
  );
}
