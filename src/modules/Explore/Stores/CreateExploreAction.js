import { create } from 'zustand';

export const CreateExploreAction = create((set, get) => ({
  formData: {
    title: '',
    description: '',
    web_link: '',
    filters: [],
    image: null,
  },
  errors: {},

  showSuccessDialog: false,
  showErrorDialog: false,

  setShowSuccessDialog: value => set({ showSuccessDialog: value }),
  setShowErrorDialog: value => set({ ShowErrorDialog: value }),

  setFormData: (field, value) =>
    set(state => ({
      formData: {
        ...state.formData,
        [field]: value,
      },
      errors: {
        ...state.errors,
        [field]: '',
      },
    })),

  validateForm: () => {
    const { formData } = get();
    let errors = {};

    if (!formData.title) errors.title = 'Title is required';
    if (!formData.description) errors.description = 'Description is required';
    if (!formData.web_link) errors.web_link = 'Web link is required';
    if (!formData.filters || formData.filters.length === 0)
      errors.filters = 'At least one filter is required';
    if (!formData.image) errors.image = 'Image is required';

    set({ errors });

    return Object.keys(errors).length === 0;
  },

  resetForm: () =>
    set({
      formData: {
        title: '',
        description: '',
        web_link: '',
        filters: [],
        image: null,
      },
      errors: {},
    }),
}));
