import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'react-native';
import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc';
import io from 'socket.io-client';
import CallLayout from './CallLayout';
import Config from '../../configs/config';

const ROOM_ID = 'support-room';

const CallerScreen = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(`${Config.SOCKET_URL}`);
    socketRef.current = socket;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    const startLocal = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      } catch (err) {
        console.error('❌ Failed to get media:', err);
      }
    };

    socket.on('connect', () => {
      console.log('✅ Caller connected:', socket.id);
      socket.emit('join', ROOM_ID);
    });

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('signal', {
          roomId: ROOM_ID,
          data: { candidate: event.candidate },
        });
      }
    };

    pc.ontrack = event => {
      console.log('🎥 Remote track received');
      setRemoteStream(event.streams[0]);
    };

    socket.on('signal', async ({ data }) => {
      if (data?.type === 'answer') {
        await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
      } else if (data?.candidate) {
        try {
          await pc.addIceCandidate(data.candidate);
        } catch (err) {
          console.error('❌ Error adding remote ICE candidate:', err);
        }
      }
    });

    startLocal();

    return () => {
      console.log('🔌 Cleaning up');
      pc.getSenders().forEach(sender => sender.track?.stop());
      pc.close();
      socket.disconnect();
    };
  }, []);

  const startCall = async () => {
    const pc = pcRef.current;
    const socket = socketRef.current;

    if (!pc || !socket || !localStream) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('signal', {
        roomId: ROOM_ID,
        data: { type: 'offer', sdp: offer.sdp },
      });
    } catch (err) {
      console.error('❌ Error creating offer:', err);
    }
  };

  return (
    <CallLayout localStream={localStream} remoteStream={remoteStream}>
      <Button title="Start Call" onPress={startCall} />
    </CallLayout>
  );
};

export default CallerScreen;
