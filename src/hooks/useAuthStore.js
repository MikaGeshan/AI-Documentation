import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create(set => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isAdmin: false,
  hydrated: false,

  login: async ({ user, access_token }) => {
    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    set({
      isAuthenticated: true,
      user,
      token: access_token,
      isAdmin: user?.role === 'admin',
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');

    set({
      isAuthenticated: false,
      user: null,
      token: null,
      isAdmin: false,
    });
  },

  hydrateFromStorage: async () => {
    const token = await AsyncStorage.getItem('token');
    const userData = await AsyncStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    if (token && user) {
      set({
        isAuthenticated: true,
        token,
        user,
        isAdmin: user?.role === 'admin',
      });
    }

    set({ hydrated: true });
  },
}));

export default useAuthStore;
