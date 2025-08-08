import { create } from 'zustand';
import { getFolderContents } from '../../services/googleDocumentService';

export const useDocumentStore = create(set => ({
  folders: [],
  selectedDoc: null,
  selectedFolderId: null,

  loading: true,
  initialLoadProgress: 0,
  isDownloading: false,
  downloadProgress: 0,

  setFolders: folders => set({ folders }),
  setSelectedDoc: selectedDoc => set({ selectedDoc }),
  setSelectedFolderId: selectedFolderId => set({ selectedFolderId }),
  setLoading: loading => set({ loading }),
  setInitialLoadProgress: progress => set({ initialLoadProgress: progress }),
  setDownloadProgress: progress => set({ downloadProgress: progress }),
  setIsDownloading: isDownloading => set({ isDownloading }),

  loadFolders: async () => {
    set({ loading: true, initialLoadProgress: 0 });

    try {
      const data = await getFolderContents();
      if (!data?.subfolders) {
        set({ folders: [], loading: false, initialLoadProgress: 100 });
        return;
      }

      const folderList = data.subfolders.map(sub => ({
        id: sub.id,
        folderName: sub.name,
        docs: sub.files || [],
      }));

      set({ folders: folderList, initialLoadProgress: 100 });
    } catch (e) {
      console.error('Error loading folders:', e);
    } finally {
      set({ loading: false });
    }
  },
}));
