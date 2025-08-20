import { create } from 'zustand';

export const ChatAction = create((set, get) => ({
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

  stage: null,
  startStage: stageName => {
    console.log('[LoadingStage] ->', stageName);
    set({ stage: stageName });
  },
  resetStage: () => set({ stage: null }),
  get loadingMessage() {
    switch (get().stage) {
      case 'fetching':
        return 'Fetching URLs .....';
      case 'parsing':
        return 'Parsing Document .....';
      case 'reading':
        return 'Reading File .....';
      default:
        return null;
    }
  },
}));
