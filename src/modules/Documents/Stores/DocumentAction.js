import { create } from 'zustand';
import { getDriveSubfolders } from '../../../App/Google';

export const DocumentAction = create(set => ({
  folders: [],
  selectedDoc: null,
  selectedFolderId: null,

  loading: true,
  initialLoadProgress: 0,
  isDownloading: false,
  downloadProgress: 0,
  refreshing: false,

  setFolders: folders => set({ folders }),
  setSelectedDoc: selectedDoc => set({ selectedDoc }),
  setSelectedFolderId: selectedFolderId => set({ selectedFolderId }),
  setLoading: loading => set({ loading }),
  setInitialLoadProgress: progress => set({ initialLoadProgress: progress }),
  setDownloadProgress: progress => set({ downloadProgress: progress }),
  setIsDownloading: isDownloading => set({ isDownloading }),
  setRefreshing: refreshing => set({ refreshing }),

  loadFolders: async () => {
    set({ loading: true, initialLoadProgress: 0 });

    try {
      const data = await getDriveSubfolders();
      console.log(data);

      if (!data?.subfolders) {
        set({ folders: [], loading: false, initialLoadProgress: 100 });
        return;
      }

      const folderList = data.subfolders.map(sub => ({
        id: sub.id,
        folderName: sub.name,
        webViewLink: sub.webViewLink,
        files: sub.files || [],
      }));

      set({ folders: folderList, initialLoadProgress: 100 });
    } catch (e) {
      console.error('Error loading folders:', e);
    } finally {
      set({ loading: false });
    }
  },

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

  setSuccess: msg => set({ successMessage: msg, showSuccess: true }),
  setError: msg => set({ errorMessage: msg, showError: true }),

  resetMessages: () =>
    set({
      successMessage: '',
      showSuccess: false,
      errorMessage: '',
      showError: false,
    }),
  resetModals: () =>
    set({
      uploadModalVisible: false,
      inputModalVisible: false,
      showSelectModal: false,
      showOption: false,
    }),
}));
