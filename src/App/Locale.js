import { GetAppListQuery, isAppListQuery } from '../utils/appListQuery';

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

export const greetingsAndListApp = async message => {
  const greetingDetected = isGreeting(message);
  const appListDetected = isAppListQuery(message);
  console.log('[INFO] Locale triggered by:', message);

  if (greetingDetected && appListDetected) {
    const list = await GetAppListQuery(message);
    return `Halo! Berikut adalah daftar aplikasi yang kamu tanyakan:\n\n${list}`;
  }

  if (greetingDetected) {
    return getInitialGreeting();
  }

  if (appListDetected) {
    return await GetAppListQuery(message);
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
