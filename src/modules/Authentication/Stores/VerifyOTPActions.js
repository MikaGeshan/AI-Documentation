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

  consentVisible: false,
  setConsentVisible: value => set({ consentVisible: value }),

  consentAuthUrl: '',
  setConsentAuthUrl: value => set({ consentAuthUrl: value }),
}));

export default VerifyOTPActions;
