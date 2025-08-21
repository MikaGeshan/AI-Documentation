import { create } from 'zustand';

export const CallerAction = create((set, get) => ({
  localStream: null,
  remoteStream: null,
  callStarted: false,
  muteMic: true,

  setLocalStream: stream => set({ localStream: stream }),
  setRemoteStream: stream => set({ remoteStream: stream }),
  setCallStarted: status => set({ callStarted: status }),
  setMuteMic: status => set({ muteMic: status }),
}));
