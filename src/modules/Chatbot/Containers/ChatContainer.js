import React, { useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Fuse from 'fuse.js';

import ChatComponent from '../Components/ChatComponent';
import { ChatAction } from '../Stores/ChatAction';

import { DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_URL } from '@env';
import { cutText } from '../../../App/Locale';
import SignInActions from '../../Authentication/Stores/SignInActions';
import { getFolderContents } from '../../../App/Google';
import Config from '../../../App/Network';

// const MAX_DOCS = 10;
const CACHE_PREFIX = 'doc-cache-';
const CACHE_TTL = 1000 * 60 * 60 * 24;

const getCacheKey = fileId => `${CACHE_PREFIX}${fileId}`;
const isCacheValid = cached =>
  cached?.timestamp && Date.now() - cached.timestamp < CACHE_TTL;

const chunkText = (text, size = 1000, overlap = 200) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }
  return chunks;
};

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

// Abort controller for DeepSeek API requests
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
    preloadAllDocuments();
    generateInitialGreeting();
  }, []);

  const generateInitialGreeting = async () => {
    try {
      createAbortController();
      const { data } = await axios.post(
        DEEPSEEK_URL,
        {
          model: DEEPSEEK_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'Kamu adalah asisten dokumentasi teknis. Sambut pengguna secara singkat, ramah, dan profesional. Jangan sebut dokumen apa pun sekarang.',
            },
            {
              role: 'user',
              content: 'Berikan sapaan awal untuk memulai percakapan.',
            },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          signal: getAbortSignal(),
        },
      );

      const greeting =
        data?.choices?.[0]?.message?.content?.trim() ||
        'Halo! Saya siap membantu Anda dengan dokumentasi.';
      setMessages([{ id: 'init-ai-greeting', text: greeting, sender: 'ai' }]);
    } catch (err) {
      console.error('Failed to fetch greeting:', err.message);
      setMessages([
        {
          id: 'init-ai-greeting',
          text: 'Halo! Saya siap membantu Anda dengan dokumentasi.',
          sender: 'ai',
        },
      ]);
    }
  };

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
      console.error('Document conversion failed:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
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
      const documents = await getFolderContents();
      const subfolders = documents?.subfolders || [];
      const allDocs = subfolders.flatMap(folder =>
        folder.files.map(file => ({
          ...file,
          folderName: folder.name,
          folderLink: folder.webViewLink,
        })),
      );

      if (allDocs.length === 0) {
        clearStageMessage();
        return addMessage({
          id: `ai-${Date.now()}`,
          text: 'Saya tidak menemukan dokumen yang relevan.',
          sender: 'ai',
        });
      }

      showStageMessage('parsing');

      // Ask AI which document is relevant
      createAbortController();
      const { data: selectDocument } = await axios.post(
        DEEPSEEK_URL,
        {
          model: DEEPSEEK_MODEL,
          messages: [
            {
              role: 'system',
              content: `
                    Kamu adalah asisten dokumentasi yang bertugas *hanya* untuk memilih dokumen atau folder
                    yang relevan dari pertanyaan pengguna.

                    Aturan:
                    1. Jawablah dengan persis **nama dokumen** atau **nama folder** yang ada di daftar, tanpa tambahan kata lain.
                    2. Jika ada kecocokan yang sangat jelas → jawab persis dengan nama dokumen/folder
                    3. Jika tidak ada kecocokan yang sangat jelas, cari dokumen/folder yang paling mendekati dan jawab dengan nama dokumen/folder tersebut.
                    4. Jika sama sekali tidak ada informasi yang relevan, jawab "UNKNOWN".
                    5. Gunakan nama dokumen/folder secara persis sesuai yang tersedia (case-insensitive boleh).
                    6. Hanya boleh mengembalikan **satu nama dokumen/folder** atau "UNKNOWN".
                    `,
            },
            {
              role: 'user',
              content: `
                      Pertanyaan: "${userText}"

                      Berikut daftar dokumen dan folder yang tersedia:
                      ${allDocs
                        .map(doc => `- ${doc.name} (folder: ${doc.folderName})`)
                        .join('\n')}

                      Pilih satu nama dokumen/folder yang paling relevan dari daftar di atas.
                      Jika tidak ada yang cocok → jawab "NULL".
                      `,
            },
          ],
          temperature: 0.0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          signal: getAbortSignal(),
        },
      );

      const selectDocName =
        selectDocument?.choices?.[0]?.message?.content?.trim();
      console.log('=== selected document name:', selectDocName);

      // Try to match selectDocName with existing docs
      let selectedDocs = [];
      if (selectDocName && selectDocName !== 'UNKNOWN') {
        const fuseForNames = new Fuse(allDocs, {
          keys: ['name', 'folderName'],
          threshold: 0.4,
        });

        const results = fuseForNames.search(selectDocName);
        selectedDocs = results.map(r => r.item);

        console.log('=== matched documents based on name:', selectedDocs);
      }

      // If no doc matched by name, fallback to chunk search
      if (selectedDocs.length === 0) {
        const chunksForSearch = [];
        for (const doc of allDocs) {
          let cached = await getCachedDocument(doc.id);
          if (!cached) {
            const converted = await convertDocument(doc.id);
            if (converted?.content) {
              await cacheDocument(doc.id, converted);
              cached = converted;
            }
          }
          if (cached?.content) {
            const chunks = chunkText(cached.content);
            chunks.forEach((chunk, idx) =>
              chunksForSearch.push({
                fileId: doc.id,
                title: doc.name || cached.title,
                folderName: doc.folderName,
                chunk,
                chunkIndex: idx,
                url: cached.url,
              }),
            );
          }
        }

        const fuse = new Fuse(chunksForSearch, {
          includeScore: true,
          threshold: 0.3,
          ignoreLocation: true,
          minMatchCharLength: 2,
          keys: [{ name: 'chunk', weight: 0.5 }],
        });

        const results = fuse.search(userText);
        const matchedChunks = results.map(r => r.item);

        if (matchedChunks.length === 0) {
          clearStageMessage();
          return addMessage({
            id: `ai-${Date.now()}`,
            text: 'Saya tidak menemukan informasi yang relevan.',
            sender: 'ai',
          });
        }

        selectedDocs = [
          ...new Map(matchedChunks.map(c => [c.fileId, c])).values(),
        ];
      }

      // Read  chunks from selectedDocs
      showStageMessage('reading');
      let fullContext = '';
      for (const doc of selectedDocs) {
        let cached = await getCachedDocument(doc.id);
        if (!cached) {
          const converted = await convertDocument(doc.id);
          if (converted?.content) {
            await cacheDocument(doc.id, converted);
            cached = converted;
          }
        }
        if (cached?.content) {
          fullContext += `\n---\nDokumen: ${doc.name}\nFolder: ${doc.folderName}\n\n${cached.content}`;
        }
      }

      // Build  system prompt
      const SYSTEM_PROMPT = `
      Kamu adalah asisten dokumentasi teknis yang ramah, profesional, dan akurat.

      Tugasmu:
      1. Gunakan hanya informasi dari konteks yang ditanyakan di bawah ini untuk menjawab.
      2. Jika informasi tidak ditemukan dalam konteks, jawab secara sopan:
        "Saya tidak menemukan informasi yang relevan di dokumentasi."
      3. Jangan menebak atau membuat informasi baru.
      4. Jika ada langkah-langkah, berikan secara runtut dan jelas.
      5. Jika relevan, sebutkan nama dokumen atau folder sebagai referensi.
      6. Jawaban harus ringkas, jelas, dan mudah dipahami.

      Konteks (potongan dokumen, judul, dan folder):
      ${cutText(fullContext)}

      Pertanyaan Pengguna:
      "${userText}"

      Berikan jawaban yang paling sesuai berdasarkan konteks di atas.
      `;

      createAbortController();
      const { data } = await axios.post(
        DEEPSEEK_URL,
        {
          model: DEEPSEEK_MODEL,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }],
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

      clearStageMessage();
      addMessage({
        id: `ai-${Date.now()}`,
        text:
          data?.choices?.[0]?.message?.content?.trim() ||
          'Saya tidak menemukan jawaban yang relevan.',
        sender: 'ai',
      });
    } catch (err) {
      console.error('=== RAG error:', err.message);
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
