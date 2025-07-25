import axios from 'axios';
import { GOOGLE_CONVERT_SCRIPT } from '../configs/google_script';
import { API_URL } from '@env';

export const getFolderContents = async () => {
  try {
    const url = `${API_URL}/api/drive-contents`;
    console.log('Fetching folder contents from:', url);

    const response = await axios.get(url);

    const data = response.data;

    const mapped = {
      subfolders: data.subfolders.map(sub => ({
        id: sub.id,
        name: sub.name,
        webViewLink: sub.webViewLink,
        files: sub.files.map(file => ({
          ...file,
          downloadUrl:
            file.mimeType === 'application/vnd.google-apps.document'
              ? file.webViewLink
              : `https://drive.google.com/uc?id=${file.id}&export=download`,
        })),
      })),
    };

    console.log(mapped);

    return mapped;
  } catch (error) {
    console.error(
      'Failed to fetch drive contents',
      error?.response?.data || error.message,
    );
    return null;
  }
};

export const convertDocument = async fileUrl => {
  try {
    console.log('Starting document conversion for URL:', fileUrl);

    let fileId;

    if (fileUrl.includes('docs.google.com/document/d/')) {
      const match = fileUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
      fileId = match?.[1];
      console.log('Detected Google Docs file, ID:', fileId);
    } else if (fileUrl.includes('drive.google.com/file/d/')) {
      const match = fileUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      fileId = match?.[1];
      console.log('Detected Drive file, ID:', fileId);
    } else if (fileUrl.includes('drive.google.com/uc?id=')) {
      const match = fileUrl.match(/uc\?id=([a-zA-Z0-9-_]+)/);
      fileId = match?.[1];
      console.log('Detected UC download link, ID:', fileId);
    }

    if (!fileId) throw new Error('Invalid Google Drive or Docs URL');

    const scriptUrl = `${GOOGLE_CONVERT_SCRIPT}?fileId=${fileId}`;
    console.log('Calling Apps Script at:', scriptUrl);

    const res = await axios.get(scriptUrl);

    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

    if (data?.error) {
      throw new Error(`Apps Script error: ${data.error}`);
    }

    if (!data?.title || !data?.content) {
      throw new Error('Invalid response structure from Apps Script');
    }

    console.log('Document conversion successful:', data.title);
    return {
      title: data.title,
      url: data.url,
      content: data.content,
    };
  } catch (error) {
    console.error('Document conversion failed:', error.message);
    return null;
  }
};
