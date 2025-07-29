import axios from 'axios';
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

export const convertDocument = async fileId => {
  try {
    if (!fileId) throw new Error('Missing file ID');

    const backendUrl = `${API_URL}/api/convert-docs`;
    console.log('Calling backend at:', backendUrl);

    const response = await axios.post(backendUrl, {
      file_id: fileId,
    });

    const data = response.data;

    if (data?.error) {
      throw new Error(`Backend error: ${data.error}`);
    }

    if (!data?.text) {
      throw new Error('Invalid response from backend');
    }

    console.log('Document conversion successful from backend');
    return {
      fileId,
      title: data.title || 'Untitled',
      content: data.text,
    };
  } catch (error) {
    console.error('Document conversion failed:', error.message);
    return null;
  }
};
