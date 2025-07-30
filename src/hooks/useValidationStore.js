import { create } from 'zustand';

export const useValidationStore = create(set => ({
  isAdmin: false,
  showOption: false,
  expandedFolder: null,
  uploadModalVisible: false,
  inputModalVisible: false,
  showSelectModal: false,
  selectMode: null,

  successMessage: '',
  showSuccess: false,
  errorMessage: '',
  showError: false,

  setIsAdmin: val => set({ isAdmin: val }),
  setShowOption: val => set({ showOption: val }),
  setExpandedFolder: val => set({ expandedFolder: val }),
  setUploadModalVisible: val => set({ uploadModalVisible: val }),
  setInputModalVisible: val => set({ inputModalVisible: val }),
  setShowSelectModal: val => set({ showSelectModal: val }),
  setSelectMode: val => set({ selectMode: val }),
  setSuccessMessage: msg => set({ successMessage: msg }),
  setShowSuccess: val => set({ showSuccess: val }),
  setErrorMessage: msg => set({ errorMessage: msg }),
  setShowError: val => set({ showError: val }),
}));
