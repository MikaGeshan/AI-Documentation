import { getFolderContents } from '../services/documentProcess';

export const isAppListQuery = userMessage => {
  const lower = userMessage.toLowerCase();
  return (
    lower.includes('apa saja aplikasi') ||
    lower.includes('daftar aplikasi') ||
    lower.includes('aplikasi apa saja') ||
    lower.includes('aplikasi yang tersedia') ||
    lower.includes('aplikasi terdokumentasi')
  );
};

export const GetAppListQuery = async userMessage => {
  const allDocuments = await getFolderContents();

  const folderNames = [...new Set(allDocuments.map(doc => doc.folder))];
  const lowerMsg = userMessage.toLowerCase();

  const folderGuess = folderNames.find(folder =>
    lowerMsg.includes(folder.toLowerCase()),
  );

  if (folderGuess) {
    const documents = allDocuments.filter(doc => doc.folder === folderGuess);
    const fileNames = documents.map(doc => doc.name).filter(Boolean);

    if (fileNames.length === 0) {
      return `No Documents find in the folder *${folderGuess}*.`;
    }

    return `Documents list in folder *${folderGuess}*:\n\n- ${fileNames.join(
      '\n- ',
    )}`;
  }

  if (folderNames.length === 0) {
    return 'No Documentation about the application.';
  }

  return `List of documented applications:\n\n- ${folderNames.join('\n- ')}`;
};
