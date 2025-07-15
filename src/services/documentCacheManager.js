import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFolderContents, convertDocument } from './documentProcess';

const CACHE_PREFIX = 'doc-cache-';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 jam

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

  const grouped = {};

  for (const doc of documents) {
    // console.log('Sample doc:', doc);
    const fileId = extractFileId(doc.downloadUrl);
    if (!fileId) continue;

    const cached = await getCachedDocument(fileId);
    let docData;

    if (cached) {
      console.log(`Cache available for ${doc.name}`);
      docData = {
        ...cached,
        folder: cached.folder || doc.folder || 'Lainnya',
      };
    } else {
      const result = await convertDocument(doc.downloadUrl);
      if (result?.content) {
        docData = {
          title: result.title || doc.name,
          content: result.content,
          url: result.url || doc.downloadUrl,
          folder: doc.folder || 'Lainnya',
        };
        await cacheDocument(fileId, docData);
        console.log(`Cache saved: ${doc.name}`);
      } else {
        console.warn(`Error converting document: ${doc.name}`);
        continue;
      }
    }

    const folder = docData.folder || 'Lainnya';
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(docData);
  }

  const folderNames = Object.keys(grouped);
  await AsyncStorage.setItem('doc-folder-list', JSON.stringify(folderNames));
  await AsyncStorage.setItem('doc-folder-map', JSON.stringify(grouped));

  console.log('Folder names cached:', folderNames);
  console.log('Grouped folder map saved');
  console.log('Done Preloading');
};

const extractFileId = url => {
  const match =
    url.match(/\/d\/([a-zA-Z0-9-_]+)/) || url.match(/id=([a-zA-Z0-9-_]+)/);
  return match?.[1] || null;
};
