import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc';

export const getLocalStream = async () => {
  return await mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
};

export const createPeerConnection = onTrack => {
  const pc = new RTCPeerConnection();

  pc.ontrack = event => {
    const [remoteStream] = event.streams;
    console.log('Remote Stream ', remoteStream?.id);
    onTrack(remoteStream);
  };

  return pc;
};
