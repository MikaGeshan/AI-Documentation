import { create } from 'zustand';

export const useRefreshStore = create(set => ({
  isRefreshing: false,
  setIsRefreshing: refreshing => set(() => ({ isRefreshing: refreshing })),
}));
