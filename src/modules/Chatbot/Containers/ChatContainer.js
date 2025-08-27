import React, { useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ChatComponent from '../Components/ChatComponent';
import { ChatAction } from '../Stores/ChatAction';

import { DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_URL } from '@env';
import {
  cutText,
  detectMentionedApps,
  getInitialGreeting,
  greetingsAndListApp,
} from '../../../App/Locale';
import SignInActions from '../../Authentication/Stores/SignInActions';
import { getFolderContents } from '../../../App/Google';
import Config from '../../../App/Network';

const MAX_DOCS = 4;
const CACHE_PREFIX = 'doc-cache-';
const CACHE_TTL = 1000 * 60 * 60 * 24;

const getCacheKey = fileId => `${CACHE_PREFIX}${fileId}`;

const isCacheValid = cached =>
  cached?.timestamp && Date.now() - cached.timestamp < CACHE_TTL;

const cacheDocument = async (fileId, data) => {
  await AsyncStorage.setItem(
    getCacheKey(fileId),
    JSON.stringify({ ...data, timestamp: Date.now() }),
  );
};

const getCachedDocument = async fileId => {
  const cached = await AsyncStorage.getItem(getCacheKey(fileId));
  if (!cached) return null;
  const parsed = JSON.parse(cached);
  return isCacheValid(parsed) ? parsed : null;
};

const preloadAllDocuments = async () => {
  try {
    const folderData = await getFolderContents();
    if (!folderData?.subfolders) return;

    const folderMap = Object.fromEntries(
      folderData.subfolders.map(subfolder => [subfolder.name, subfolder.files]),
    );

    await AsyncStorage.setItem('doc-folder-map', JSON.stringify(folderMap));
    console.log('Documents cached successfully');
  } catch (err) {
    console.error('Failed to preload documents:', err);
  }
};

const isAppListQuery = userMessage => {
  const lower = userMessage.toLowerCase();
  return (
    lower.includes('daftar aplikasi') ||
    lower.includes('list aplikasi') ||
    lower.includes('apa saja aplikasi') ||
    lower.includes('dokumen yang tersedia')
  );
};

const getAppListResponse = async userMessage => {
  const allDocuments = await getFolderContents();
  const subfolders = allDocuments?.subfolders || [];

  if (subfolders.length === 0) {
    return 'No Documentation about the application.';
  }

  const lowerMsg = userMessage.toLowerCase();
  const folderGuess = subfolders.find(folder =>
    lowerMsg.includes(folder.name.toLowerCase()),
  );

  if (folderGuess) {
    const fileNames = folderGuess.files.map(f => f.name).filter(Boolean);
    if (fileNames.length === 0) {
      return `No Documents found in folder *${folderGuess.name}*.`;
    }

    return `Documents list in folder *${
      folderGuess.name
    }*:\n\n- ${fileNames.join('\n- ')}`;
  }

  return `List of documented applications:\n\n- ${subfolders
    .map(f => f.name)
    .join('\n- ')}`;
};

let controller = null;

const createAbortController = () => (controller = new AbortController());
const getAbortSignal = () =>
  controller?.signal || (controller = new AbortController()).signal;
export const abortDeepSeekRequest = () => {
  controller?.abort();
  console.log('[DeepSeek] Request aborted.');
};

const stageMessages = {
  fetching: 'Listing Folders and Documents...',
  parsing: 'Processing folder contents...',
  reading: 'Reading contents and composing answers...',
};

const SYSTEM_PROMPT = (docs, userMessage) => `
Berikut ini adalah bagian-bagian dari dokumentasi aplikasi yang relevan dengan pertanyaan user:

${docs
  .map(
    doc => `### Dokumen: ${doc.title || 'Untitled'}
Link: ${doc.url}

${cutText(doc.content)}`,
  )
  .join('\n\n')}

---

Pertanyaan user:
"${userMessage}"

Petunjuk untuk menjawab:
- Jawablah *hanya berdasarkan informasi dari dokumen-dokumen di atas*.
- Jika pertanyaan menyebut satu aplikasi, berikan jawaban yang **selengkap dan sedetail mungkin**.
- Jika pertanyaan menyebut lebih dari satu aplikasi, buat perbandingan yang jelas.
- Jangan menambahkan informasi dari luar dokumen.
`;

const ChatContainer = () => {
  const {
    messages,
    setMessages,
    addMessage,
    startStage,
    resetStage,
    loadingMessage,
  } = ChatAction();
  const { user } = SignInActions();

  useEffect(() => {
    setMessages([
      { id: 'init-ai-greeting', text: getInitialGreeting(), sender: 'ai' },
    ]);
    preloadAllDocuments();
  }, [setMessages]);

  const showStageMessage = stage => {
    startStage(stage);
    addMessage({
      id: `stage-${stage}`,
      text: stageMessages[stage] || `${stage}...`,
      sender: 'ai',
      isStage: true,
    });
  };

  const clearStageMessage = () => {
    resetStage();
    setMessages(prev => prev.filter(msg => !msg.isStage));
  };

  const convertDocument = async fileId => {
    try {
      if (!fileId) throw new Error('Missing file ID');

      const { data } = await axios.post(`${Config.API_URL}/api/convert-docs`, {
        file_id: fileId,
        email: user?.email || null,
      });

      if (data?.error) throw new Error(data.error);
      if (!data?.text) throw new Error('Invalid response from backend');

      return {
        fileId,
        title: data.title || 'Untitled',
        content: data.text,
        url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      };
    } catch (error) {
      console.error('Document conversion failed:', error.message);
      return null;
    }
  };

  const handleSendMessage = async userText => {
    const userMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
    };
    addMessage(userMessage);

    try {
      showStageMessage('fetching');
      let finalAnswer = '';

      if (isAppListQuery(userText)) {
        finalAnswer = await getAppListResponse(userText);
      } else {
        const earlyResponse = await greetingsAndListApp(userText.trim());
        if (earlyResponse) {
          finalAnswer = earlyResponse;
        } else {
          const documents = await getFolderContents();
          const subfolders = documents?.subfolders || [];

          if (isAppListQuery(userText)) {
            if (subfolders.length === 0) {
              finalAnswer = 'No documented applications available.';
            } else {
              const appList = subfolders.map(f => f.name);
              finalAnswer = `List of documented applications:\n\n- ${appList.join(
                '\n- ',
              )}`;
            }
          } else {
            const mentionedApps = detectMentionedApps(
              userText,
              subfolders.map(f => f.name),
            );

            if (mentionedApps.length === 0) {
              finalAnswer = 'No applications found based on your question.';
            } else {
              showStageMessage('parsing');

              const matchedDocs = subfolders
                .filter(folder =>
                  mentionedApps.some(app =>
                    folder.name.toLowerCase().includes(app.toLowerCase()),
                  ),
                )
                .flatMap(folder =>
                  folder.files.map(file => ({
                    ...file,
                    folderName: folder.name,
                    folderLink: folder.webViewLink,
                  })),
                )
                .slice(0, MAX_DOCS);

              if (matchedDocs.length === 0) {
                finalAnswer = 'No documents matched your question.';
              } else {
                const docChunks = [];
                for (const doc of matchedDocs) {
                  if (!doc.id) continue;

                  const cached = await getCachedDocument(doc.id);
                  if (cached) {
                    docChunks.push(cached);
                  } else {
                    const converted = await convertDocument(doc.id);
                    if (converted?.content) {
                      await cacheDocument(doc.id, converted);
                      docChunks.push(converted);
                    }
                  }
                }

                if (docChunks.length === 0) {
                  finalAnswer = 'Gagal memproses isi dokumen.';
                } else {
                  showStageMessage('reading');
                  const prompt = SYSTEM_PROMPT(docChunks, userText);

                  createAbortController();
                  const { data } = await axios.post(
                    DEEPSEEK_URL,
                    {
                      model: DEEPSEEK_MODEL,
                      messages: [
                        {
                          role: 'system',
                          content:
                            'Kamu adalah asisten dokumentasi teknis yang cerdas...',
                        },
                        { role: 'user', content: prompt },
                      ],
                      temperature: 0.3,
                    },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
                      },
                      signal: getAbortSignal(),
                    },
                  );

                  finalAnswer =
                    data?.choices?.[0]?.message?.content?.trim() ||
                    'Tidak ada jawaban yang dihasilkan dari dokumen.';
                }
              }
            }
          }
        }
      }

      clearStageMessage();
      addMessage({ id: `ai-${Date.now()}`, text: finalAnswer, sender: 'ai' });
    } catch (err) {
      console.error('ChatContainer error:', err.message);
      clearStageMessage();
      addMessage({
        id: `ai-${Date.now()}`,
        text: 'Terjadi kesalahan saat memproses permintaan Anda.',
        sender: 'ai',
      });
    }
  };

  return (
    <ChatComponent
      messages={messages}
      loadingMessage={loadingMessage}
      onSendMessage={handleSendMessage}
      abortDeepSeekRequest={abortDeepSeekRequest}
    />
  );
};

export default ChatContainer;
