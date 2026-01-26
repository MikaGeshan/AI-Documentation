import { getDriveSubfolders } from './Google';

const GREETING_KEYWORDS = [
  'halo',
  'hai',
  'hi',
  'apa kabar',
  'selamat pagi',
  'selamat siang',
  'selamat sore',
  'selamat malam',
  'pagi',
  'sore',
  'malam',
];

const DEFAULT_GREETINGS = [
  'Welcome to the documentation assistant. Please type your question or topic, and I’ll provide you with the relevant information.',
  'Welcome! I’m here to assist you with our application documentation. Feel free to ask me any questions.',
  'Hello! Need help navigating the docs? Just ask me anything, and I’ll guide you to the right information.',
  'Hi there! 👋 I’m your friendly assistant. How can I help you find the information you need today?',
];

export const isGreeting = message => {
  const lower = message.toLowerCase();
  return GREETING_KEYWORDS.some(greet => lower.includes(greet));
};

export const getInitialGreeting = () => {
  const random = Math.floor(Math.random() * DEFAULT_GREETINGS.length);
  return DEFAULT_GREETINGS[random];
};

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

export const getAppList = async userMessage => {
  const allDocuments = await getDriveSubfolders();
  const folderNames = [...new Set(allDocuments.map(doc => doc.folder))];
  const lowerMsg = userMessage.toLowerCase();

  const folderGuess = folderNames.find(folder =>
    lowerMsg.includes(folder.toLowerCase()),
  );

  if (folderGuess) {
    const documents = allDocuments.filter(doc => doc.folder === folderGuess);
    const fileNames = documents.map(doc => doc.name).filter(Boolean);

    if (fileNames.length === 0) {
      return `No documents found in the folder *${folderGuess}*.`;
    }

    return `Documents list in folder *${folderGuess}*:\n\n- ${fileNames.join(
      '\n- ',
    )}`;
  }

  if (folderNames.length === 0) {
    return 'No documentation about the application.';
  }

  return `List of documented applications:\n\n- ${folderNames.join('\n- ')}`;
};

export const greetingsAndListApp = async message => {
  const greetingDetected = isGreeting(message);
  const appListDetected = isAppListQuery(message);

  console.log('[INFO] Locale triggered by:', message);

  if (greetingDetected && appListDetected) {
    const list = await getAppList(message);
    return `Halo! Berikut adalah daftar aplikasi yang kamu tanyakan:\n\n${list}`;
  }

  if (greetingDetected) {
    return getInitialGreeting();
  }

  if (appListDetected) {
    return await getAppList(message);
  }

  return null;
};

export const cutText = (text, maxLength = 2000) =>
  text.length > maxLength ? text.slice(0, maxLength) + '...' : text;

export const extractAppNames = documents => {
  const rawNames = documents.flatMap(doc => {
    const name = doc.name?.split('.')[0] || '';
    const folder = doc.folder || '';
    return [name, folder];
  });

  return [
    ...new Set(
      rawNames
        .map(name =>
          name
            .replace(/[_-]/g, ' ')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/\b(Doc|Documentation|Manual|Guide)\b/gi, '')
            .trim(),
        )
        .filter(Boolean),
    ),
  ];
};

export const detectMentionedApps = (message, appNames) => {
  const lower = message.toLowerCase();
  return appNames.filter(name => lower.includes(name.toLowerCase()));
};
