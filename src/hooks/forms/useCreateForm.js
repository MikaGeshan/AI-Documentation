import { create } from 'zustand';

export const useCreateForm = create(set => ({
  formData: {
    title: '',
    description: '',
    filters: [],
    web_link: '',
    image: '',
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
        title: '',
        description: '',
        filters: '',
        web_link: '',
        image: '',
      },
      errors: {},
    }),
  validateForm: () => {
    let isValid = true;
    const newErrors = {};
    const { title, description, image, web_link } =
      useCreateForm.getState().formData;

    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }
    if (!web_link.trim()) {
      newErrors.web_link = 'Image Cover is required';
      isValid = false;
    }
    if (!image.trim()) {
      newErrors.image = 'Image Cover is required';
      isValid = false;
    }

    useCreateForm.getState().setErrors(newErrors);
    return isValid;
  },
}));
