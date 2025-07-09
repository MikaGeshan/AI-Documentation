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

export const isGreeting = message => {
  const lower = message.toLowerCase();
  return GREETING_KEYWORDS.some(greet => lower.includes(greet));
};

export const getInitialGreeting = () => {
  const greetings = [
    'Welcome to the documentation assistant. Please type your question or topic, and I’ll provide you with the relevant information.',
    'Welcome! I’m here to assist you with our application documentation. Feel free to ask me any questions.',
    'Hello! Need help navigating the docs? Just ask me anything, and I’ll guide you to the right information.',
    'Hi there! 👋 I’m, your friendly assistant. How can I help you find the information you need today?',
  ];
  const random = Math.floor(Math.random() * greetings.length);
  return greetings[random];
};
