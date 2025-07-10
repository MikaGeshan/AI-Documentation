import { GetAppListQuery, isAppListQuery } from './appListQuery';

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
  console.log('[INFO] greetingsAndListApp triggered by:', message);

  if (greetingDetected && appListDetected) {
    const list = await GetAppListQuery(message);
    return `Halo! 😊 Berikut adalah daftar aplikasi yang kamu tanyakan:\n\n${list}`;
  }

  if (greetingDetected) {
    return getInitialGreeting();
  }

  if (appListDetected) {
    return await GetAppListQuery(message);
  }

  return null;
};
