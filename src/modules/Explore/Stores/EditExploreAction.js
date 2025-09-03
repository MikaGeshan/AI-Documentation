import { create } from 'zustand';

export const EditExploreAction = create(set => ({
  formData: {
    title: '',
    description: '',
    web_link: '',
    filters: [],
    image: '',
  },
  setFormData: (key, value) =>
    set(state => ({
      formData: { ...state.formData, [key]: value },
    })),

  errors: {},
  setErrors: (key, value) =>
    set(state => ({ errors: { ...state.errors, [key]: value } })),
  resetErrors: () => set({ errors: {} }),

  imageFile: null,
  setImageFile: file => set({ imageFile: file }),
  originalData: {},
  setOriginalData: data => set({ originalData: data }),
  showSuccessDialog: false,
  showErrorDialog: false,
  setShowSuccessDialog: value => set({ showSuccessDialog: value }),
  setShowErrorDialog: value => set({ ShowErrorDialog: value }),

  validateForm: () => {
    let valid = true;
    set(state => {
      const newErrors = {};
      if (!state.formData.title.trim()) {
        newErrors.title = 'Title is required';
        valid = false;
      }
      if (!state.formData.description.trim()) {
        newErrors.description = 'Description is required';
        valid = false;
      }
      if (!state.formData.web_link.trim()) {
        newErrors.web_link = 'Web link is required';
        valid = false;
      }
      if ((state.formData.filters || []).length === 0) {
        newErrors.filters = 'At least one filter is required';
        valid = false;
      }
      if (!state.formData.image) {
        newErrors.image = 'Image is required';
        valid = false;
      }
      return { errors: newErrors };
    });
    return valid;
  },

  resetForm: () =>
    set({
      formData: {
        title: '',
        description: '',
        web_link: '',
        filters: [],
        image: '',
      },
      errors: {},
      imageFile: null,
      originalData: {},
      showDialog: false,
    }),
}));
