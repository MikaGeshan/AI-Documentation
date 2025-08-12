import { create } from 'zustand';

export const useDeletingStore = create(set => ({
  isDeleting: false,
  setIsDeleting: deleting => set(() => ({ isDeleting: deleting })),
}));
