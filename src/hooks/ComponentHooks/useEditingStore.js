import { create } from 'zustand';

export const useEditingStore = create(set => ({
  isEditing: false,
  setIsEditing: editing => set(() => ({ isEditing: editing })),
}));
