import { getFolderContents } from '../services/googleDocumentService';

export const isAppListQuery = userMessage => {
  const lower = userMessage.toLowerCase().trim();
  const matchPatterns = [
    /^apa saja aplikasi/i,
    /^sebutkan aplikasi/i,
    /^list aplikasi/i,
    /^daftar aplikasi/i,
    /^dokumen yang tersedia/i,
    /^dokumen apa saja/i,
    /^aplikasi apa saja yang tersedia/i,
    /^tolong tampilkan daftar aplikasi/i,
  ];

  return matchPatterns.some(pattern => pattern.test(lower));
};

console.log(isAppListQuery('Apa saja aplikasi yang terdokumentasi?'));

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
