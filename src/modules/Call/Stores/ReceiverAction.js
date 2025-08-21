import create from 'zustand';

export const ReceiverAction = create(set => ({
  localStream: null,
  remoteStream: null,
  offer: null,
  muteMic: true,
  callStarted: false,

  setLocalStream: localStream => set({ localStream }),
  setRemoteStream: remoteStream => set({ remoteStream }),
  setOffer: offer => set({ offer }),
  setMuteMic: muteMic => set({ muteMic }),
  setCallStarted: callStarted => set({ callStarted }),
}));
