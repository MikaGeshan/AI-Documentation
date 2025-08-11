import { create } from 'zustand';

export const useExpandStore = create(set => ({
  expanded: false,
  setExpanded: value => set({ expanded: value }),
  toggleExpanded: () => set(state => ({ expanded: !state.expanded })),
}));
