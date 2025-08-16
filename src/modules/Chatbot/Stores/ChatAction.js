import { create } from 'zustand';

export const ChatStores = create(set => ({
  messages: [],
  setMessages: updater =>
    set(state => {
      const updatedMessages =
        typeof updater === 'function' ? updater(state.messages) : updater;
      return { messages: updatedMessages };
    }),
  addMessage: message =>
    set(state => ({
      messages: [...state.messages, message],
    })),
  resetMessages: () => set({ messages: [] }),
}));
