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
  console.log('Preloading Documents...');
  const documents = await getFolderContents();

  for (const doc of documents) {
    const fileId = extractFileId(doc.downloadUrl);
    if (!fileId) continue;

    const cached = await getCachedDocument(fileId);
    if (cached) {
      console.log(`Cache available for ${doc.name}`);
      continue;
    }

    const result = await convertDocument(doc.downloadUrl);
    if (result?.content) {
      await cacheDocument(fileId, {
        title: result.title || doc.name,
        content: result.content,
        url: result.url || doc.downloadUrl,
        folder: doc.folderName,
      });
      console.log(`Cache saved${doc.name}`);
    } else {
      console.warn(`Error converting document: ${doc.name}`);
    }
  }

  const folderNames = [
    ...new Set(documents.map(doc => doc.folder).filter(Boolean)),
  ];

  await AsyncStorage.setItem('doc-folder-list', JSON.stringify(folderNames));
  console.log('Folder names cached:', folderNames);

  console.log('Done Preloading');
};

const extractFileId = url => {
  const match =
    url.match(/\/d\/([a-zA-Z0-9-_]+)/) || url.match(/id=([a-zA-Z0-9-_]+)/);
  return match?.[1] || null;
};
