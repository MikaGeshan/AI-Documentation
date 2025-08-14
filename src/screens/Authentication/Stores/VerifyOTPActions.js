import { create } from 'zustand';

const VerifyOTPActions = create(set => ({
  code: '',
  error: '',
  isVerifying: false,
  isResending: false,

  setCode: value => set({ code: value }),
  setError: msg => set({ error: msg }),
  setIsVerifying: val => set({ isVerifying: val }),
  setIsResending: val => set({ isResending: val }),
}));

export default VerifyOTPActions;
