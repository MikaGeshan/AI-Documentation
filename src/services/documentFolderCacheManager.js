// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const preloadAllFolders = async () => {
  const folderListJson = await AsyncStorage.getItem('doc-folder-list');
  const folderList = folderListJson ? JSON.parse(folderListJson) : [];

  const allKeys = await AsyncStorage.getAllKeys();
  const docKeys = allKeys.filter(key => key.startsWith('doc-cache-'));

  const allDocsRaw = await Promise.all(
    docKeys.map(key => AsyncStorage.getItem(key)),
  );
  const allDocs = allDocsRaw
    .map(json => {
      try {
        return JSON.parse(json);
      } catch {
        return null;
      }
    })
    .filter(doc => doc && doc.folder);

  return folderList.map(folder => ({
    folderName: folder,
    docs: allDocs.filter(doc => doc.folder === folder),
  }));
};
