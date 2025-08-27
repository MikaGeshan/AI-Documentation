import { create } from 'zustand';
import axios from 'axios';
import Config from '../../../App/Network';

export const ExploreAction = create((set, get) => ({
  exploreData: [],
  displayData: [],
  isLoading: false,
  isRefreshing: false,
  isEditing: false,
  isDeleting: false,

  getContent: async () => {
    try {
      set({ isLoading: true });
      const response = await axios.get(
        `${Config.API_URL}/api/explore-contents`,
      );
      set({ exploreData: response.data.data, isLoading: false });
      console.log('Retrieved explore content:', response.data.data);
    } catch (error) {
      console.error('Failed to fetch explore content:', error);
      set({ isLoading: false });
    }
  },

  refreshContent: async () => {
    set({ isRefreshing: true });
    await get().getContent();
    set({ isRefreshing: false });
  },

  setExploreData: data => set({ exploreData: data }),
  setDisplayData: data => set({ displayData: data }),
  setIsEditing: value => set({ isEditing: value }),
  setIsDeleting: value => set({ isDeleting: value }),
  setIsRefreshing: value => set({ isRefreshing: value }),
}));
