import { create } from 'zustand';

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
}));

export default SignInActions;
