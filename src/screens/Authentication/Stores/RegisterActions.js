import { create } from 'zustand';

export const RegisterActions = create((set, get) => ({
  formData: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  errors: {},

  setFormData: (field, value) =>
    set(state => ({
      formData: { ...state.formData, [field]: value },
      errors: { ...state.errors, [field]: '' },
    })),
  setErrors: newErrors => set({ errors: newErrors }),
  resetForm: () =>
    set({
      formData: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      errors: {},
    }),
  validateForm: () => {
    const { formData, setErrors } = get();
    const newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  },

  showPassword: false,
  togglePassword: () => set(state => ({ showPassword: !state.showPassword })),

  showConfirmPassword: false,
  setShowConfirmPassword: value => set({ showConfirmPassword: value }),

  showSuccessDialog: false,
  setShowSuccessDialog: value => set({ showSuccessDialog: value }),

  showErrorDialog: false,
  setShowErrorDialog: value => set({ showErrorDialog: value }),

  isLoading: false,
  setIsLoading: value => set({ isLoading: value }),
}));
