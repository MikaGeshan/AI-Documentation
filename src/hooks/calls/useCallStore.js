import { create } from 'zustand';

export const useCallStore = create(set => ({
  incomingOffer: null,
  setIncomingOffer: offer => set({ incomingOffer: offer }),
  clearIncomingOffer: () => set({ incomingOffer: null }),
}));
