import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFolderContents, convertDocument } from './documentProcess';

const CACHE_PREFIX = 'doc-cache-';
const CACHE_TTL = 1000 * 60 * 60 * 24;

const getCacheKey = fileId => `${CACHE_PREFIX}${fileId}`;

const isCacheValid = cached => {
  if (!cached || !cached.timestamp) return false;
  const age = Date.now() - cached.timestamp;
  return age < CACHE_TTL;
};

export const cacheDocument = async (fileId, data) => {
  const key = getCacheKey(fileId);
  const payload = {
    ...data,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
};

export const getCachedDocument = async fileId => {
  const key = getCacheKey(fileId);
  const cached = await AsyncStorage.getItem(key);
  if (!cached) return null;

  const parsed = JSON.parse(cached);
  return isCacheValid(parsed) ? parsed : null;
};

export const preloadAllDocuments = async () => {
  try {
    const folderData = await getFolderContents();
    if (!folderData || !folderData.subfolders) return;

    const folderMap = {};

    folderData.subfolders.forEach(subfolder => {
      folderMap[subfolder.name] = subfolder.files;
    });

    await AsyncStorage.setItem('doc-folder-map', JSON.stringify(folderMap));
    console.log('Documents cached successfully');
  } catch (err) {
    console.error('Failed to preload documents:', err);
    throw err;
  }
};
