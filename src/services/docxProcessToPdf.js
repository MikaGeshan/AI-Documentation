import RNFS from 'react-native-fs';
import { GOOGLE_CONVERT_SCRIPT_PDF } from '../configs/google_script';

export const fetchConvertedPdfUrl = async docUrl => {
  try {
    const match = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const docId = match ? match[1] : null;

    if (!docId) {
      console.error('Gagal mengekstrak ID dari URL:', docUrl);
      return null;
    }

    const fullUrl = `${GOOGLE_CONVERT_SCRIPT_PDF}?id=${docId}`;
    const response = await fetch(fullUrl);
    console.log('Response:', response);
    const text = await response.text();

    console.log('Raw response:', text);

    const data = JSON.parse(text);
    return data.pdfUrl;
  } catch (error) {
    console.error('Error fetchConvertedPdfUrl:', error);
    return null;
  }
};

export const downloadPdfToCache = async (pdfUrl, fileName = 'document') => {
  const safeFileName = fileName.replace(/[^\w.-]+/g, '_').replace(/_+$/, '');

  const localPath = `${RNFS.CachesDirectoryPath}/${safeFileName}.pdf`;

  try {
    const exists = await RNFS.exists(localPath);
    if (exists) {
      console.log('[Cache Hit] PDF already exists:', localPath);
      return localPath;
    }

    console.log('[Downloading] PDF from:', pdfUrl);
    const result = await RNFS.downloadFile({
      fromUrl: pdfUrl,
      toFile: localPath,
    }).promise;

    if (result.statusCode === 200) {
      console.log('[Downloaded] PDF saved to:', localPath);
      return localPath;
    } else {
      throw new Error(`Gagal mengunduh PDF. Status code: ${result.statusCode}`);
    }
  } catch (err) {
    console.error('[Error] downloadPdfToCache:', err);
    return null;
  }
};
