import React, { useEffect, useRef, useState } from 'react';
import { Button, Text } from 'react-native';
import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc';
import io from 'socket.io-client';
import CallLayout from './CallLayout';
import Config from '../../configs/config';

const ROOM_ID = 'support-room';

const ReceiverScreen = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [pendingCandidates, setPendingCandidates] = useState([]);

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
        console.error('❌ Error getting local media:', err);
      }
    };

    socket.on('connect', () => {
      console.log('✅ Receiver connected:', socket.id);
      socket.emit('join', ROOM_ID);
    });

    pc.ontrack = event => {
      console.log('🎥 Remote stream received');
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('signal', {
          roomId: ROOM_ID,
          data: { candidate: event.candidate },
        });
      }
    };

    socket.on('signal', async ({ data }) => {
      if (data?.type === 'offer') {
        console.log('📞 Incoming offer');
        setIncomingOffer(data);
      } else if (data?.candidate) {
        const pc = pcRef.current;
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (err) {
            console.error('❌ Error adding ICE candidate:', err);
          }
        } else {
          setPendingCandidates(prev => [...prev, data.candidate]);
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

  const answerCall = async () => {
    const pc = pcRef.current;
    const socket = socketRef.current;

    if (!incomingOffer?.sdp || !pc || !socket) return;

    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: incomingOffer.sdp });

      for (const candidate of pendingCandidates) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error('❌ Error adding pending ICE candidate:', err);
        }
      }
      setPendingCandidates([]);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('signal', {
        roomId: ROOM_ID,
        data: { type: 'answer', sdp: answer.sdp },
      });

      setIncomingOffer(null);
    } catch (err) {
      console.error('❌ Failed to answer call:', err);
    }
  };

  return (
    <CallLayout localStream={localStream} remoteStream={remoteStream}>
      {incomingOffer ? (
        <>
          <Text>📞 Incoming call detected</Text>
          <Button title="Answer Call" onPress={answerCall} />
        </>
      ) : (
        <Text>🔒 Waiting for call...</Text>
      )}
    </CallLayout>
  );
};

export default ReceiverScreen;
