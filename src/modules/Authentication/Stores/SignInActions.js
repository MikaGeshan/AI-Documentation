import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignInActions = create(set => ({
  formData: {
    emailOrName: '',
    password: '',
  },
  errors: {},
  showPassword: false,
  showSuccessDialog: false,
  isLoading: false,

  updateFormData: (field, value) =>
    set(state => ({
      formData: { ...state.formData, [field]: value },
      errors: { ...state.errors, [field]: '' },
    })),

  setErrors: errors => set({ errors }),
  setShowPassword: value => set({ showPassword: value }),
  setShowSuccessDialog: value => set({ showSuccessDialog: value }),
  setIsLoading: value => set({ isLoading: value }),

  resetForm: () =>
    set({
      formData: { emailOrName: '', password: '' },
      errors: {},
      showPassword: false,
      showSuccessDialog: false,
      isLoading: false,
    }),

  isAuthenticated: false,
  user: null,
  token: null,
  isAdmin: false,
  hydrated: false,

  login: async ({ user, access_token, is_admin }) => {
    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    set({
      isAuthenticated: true,
      user,
      token: access_token,
      isAdmin: is_admin ?? user?.role === 'admin',
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
        isAdmin: user?.role?.toLowerCase() === 'admin',
      });
    }

    set({ hydrated: true });
  },
}));

export default SignInActions;
