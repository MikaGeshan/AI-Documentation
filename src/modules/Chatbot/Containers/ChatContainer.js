import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Fuse from 'fuse.js';

import ChatComponent from '../Components/ChatComponent';
import { ChatAction } from '../Stores/ChatAction';
import SignInActions from '../../Authentication/Stores/SignInActions';
import { getDriveSubfolders } from '../../../App/Google';
import { cutText } from '../../../App/Locale';
import Config from '../../../App/Network';
import { DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_URL } from '@env';

const CACHE_PREFIX = 'doc-cache-';
const CACHE_INDEX_KEY = 'doc-cache-index';
const CACHE_TTL = 1000 * 60 * 60 * 24;
const CACHE_MAX_ITEMS = 40;
const REQUEST_RETRY = 1;
const CONVERT_TIMEOUT_MS = 60_000;

const log = (...args) => {
  if (typeof __DEV__ !== 'undefined' ? __DEV__ : true)
    console.log('[ChatContainer]', ...args);
};

const getCacheKey = id => `${CACHE_PREFIX}${id}`;
const now = () => Date.now();

const isCacheValid = cached =>
  cached && cached.timestamp && now() - cached.timestamp < CACHE_TTL;

const sleep = ms => new Promise(res => setTimeout(res, ms));

const withRetries = async (fn, attempts = REQUEST_RETRY) => {
  let lastErr;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      log(`attempt ${i + 1} failed:`, err?.message || err);
      if (i < attempts) await sleep(300 * (i + 1));
    }
  }
  throw lastErr;
};

const createAbortController = () => new AbortController();

const readCacheIndex = async () => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    log('readCacheIndex error', err.message);
    return [];
  }
};

const writeCacheIndex = async idx => {
  try {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(idx));
  } catch (err) {
    log('writeCacheIndex error', err.message);
  }
};

const touchCacheIndex = async fileId => {
  const idx = await readCacheIndex();
  const filtered = idx.filter(e => e.id !== fileId);
  filtered.unshift({ id: fileId, timestamp: now() });
  const trimmed = filtered.slice(0, CACHE_MAX_ITEMS);
  await writeCacheIndex(trimmed);
  const toDelete = idx
    .map(e => e.id)
    .filter(id => !trimmed.find(t => t.id === id));
  try {
    await Promise.all(
      toDelete.map(id => AsyncStorage.removeItem(getCacheKey(id))),
    );
    if (toDelete.length) log('Evicted cache items:', toDelete);
  } catch (e) {
    log('eviction error', e.message);
  }
};

const cacheDocument = async (fileId, data) => {
  try {
    await AsyncStorage.setItem(
      getCacheKey(fileId),
      JSON.stringify({ ...data, timestamp: now() }),
    );
    await touchCacheIndex(fileId);
  } catch (err) {
    log('cacheDocument error', err.message);
  }
};

const getCachedDocument = async fileId => {
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(fileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isCacheValid(parsed)) return null;
    touchCacheIndex(fileId).catch(() => {});
    return parsed;
  } catch (err) {
    log('getCachedDocument error', err.message);
    return null;
  }
};

const convertDocument = async (fileId, email, signal) => {
  const doConvert = async () => {
    const source = axios.CancelToken.source();
    const timeout = setTimeout(
      () => source.cancel('convert-docs timeout'),
      CONVERT_TIMEOUT_MS,
    );

    try {
      const resp = await axios.post(
        `${Config.API_URL.replace(/\/$/, '')}/api/convert-docs`,
        { file_id: fileId, email },
        {
          headers: { 'Content-Type': 'application/json' },
          cancelToken: source.token,
          signal,
        },
      );

      clearTimeout(timeout);

      const data = resp?.data;
      if (!data) throw new Error('No response body from convert-docs');
      if (data?.error) throw new Error(data.error);
      if (!data?.text && !data?.content)
        throw new Error('convert-docs missing text/content');

      const text = data.text ?? data.content;
      const result = {
        fileId,
        title: data.title || data.name || 'Untitled',
        content: text,
        url:
          data.url ||
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      };

      await cacheDocument(fileId, result);
      return result;
    } catch (err) {
      clearTimeout(timeout);
      if (axios.isCancel(err))
        throw new Error(`convert-docs cancelled: ${err.message}`);
      throw err;
    }
  };

  return withRetries(() => doConvert(), 1);
};

const callDeepSeek = async ({ messages, temperature = 0.4, signal } = {}) => {
  return withRetries(async () => {
    const controller = createAbortController();
    const fetchSignal = signal || controller.signal;

    const resp = await axios.post(
      DEEPSEEK_URL,
      { model: DEEPSEEK_MODEL, messages, temperature },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        signal: fetchSignal,
      },
    );

    const data = resp?.data;
    if (!data) throw new Error('Empty response from DeepSeek');

    if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
      return data;
    }

    if (typeof data.output_text === 'string') {
      return { choices: [{ message: { content: data.output_text } }] };
    }

    if (typeof data.result === 'string') {
      return { choices: [{ message: { content: data.result } }] };
    }

    const fallback = JSON.stringify(data).slice(0, 2000);
    return { choices: [{ message: { content: fallback } }] };
  }, 2);
};

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

const selectDocumentWithLLM = async (userText, allDocs, signal) => {
  try {
    const list = allDocs
      .map(doc => `- ${doc.name} (folder: ${doc.folderName})`)
      .join('\n');
    const data = await callDeepSeek({
      temperature: 0.0,
      messages: [
        {
          role: 'system',
          content: `Kamu adalah asisten pemilih dokumen. Jawab hanya nama dokumen/folder dari daftar di bawah atau "UNKNOWN".`,
        },
        {
          role: 'user',
          content: `Pertanyaan: "${userText}"\n\nDaftar:\n${list}`,
        },
      ],
      signal,
    });

    const content = data?.choices?.[0]?.message?.content?.trim();
    return content || 'UNKNOWN';
  } catch (err) {
    log('selectDocumentWithLLM error', err.message);
    return 'UNKNOWN';
  }
};

const retrieveRelevantDocs = async (userText, allDocs, userEmail, signal) => {
  const selectedName = await selectDocumentWithLLM(userText, allDocs, signal);
  console.log('selectedName', selectedName);

  let match = null;

  if (selectedName && selectedName !== 'UNKNOWN') {
    const fuse = new Fuse(allDocs, {
      keys: ['folderName', 'name'],
      threshold: 0.3,
    });

    const results = fuse.search(selectedName);

    match = results.find(
      r => r.item.folderName?.toLowerCase() === selectedName.toLowerCase(),
    )?.item;

    if (!match) {
      match = results.find(
        r => r.item.name?.toLowerCase() === selectedName.toLowerCase(),
      )?.item;
    }

    if (!match) {
      match = results?.[0]?.item;
    }

    console.log('LLM matched:', match);

    if (match) {
      console.log('===match found', match);
      let cached = await getCachedDocument(match.id);
      if (!cached) cached = await convertDocument(match.id, userEmail, signal);
      if (!cached?.content) return [];

      const chunks = chunkText(cached.content);
      return [
        {
          fileId: match.id,
          title: match.name,
          folderName: match.folderName,
          chunks,
        },
      ];
    }
  }

  console.log('Fallback: fuzzy search across all docs…');

  const chunksForSearch = [];
  for (const doc of allDocs) {
    let cached = await getCachedDocument(doc.id);
    if (!cached) {
      try {
        cached = await convertDocument(doc.id, userEmail, signal);
      } catch (e) {
        log('convertDocument failed for', doc.id, e.message);
      }
    }
    if (!cached?.content) continue;

    const chunks = chunkText(cached.content);
    chunks.forEach((chunk, i) =>
      chunksForSearch.push({
        fileId: doc.id,
        title: doc.name,
        folderName: doc.folderName,
        chunk,
        index: i,
      }),
    );
  }

  const fuse = new Fuse(chunksForSearch, {
    includeScore: true,
    threshold: 0.35,
    keys: ['chunk'],
  });

  const results = fuse
    .search(userText)
    .slice(0, 10)
    .map(r => r.item);

  return [...new Map(results.map(r => [r.fileId, r])).values()];
};

const summarizeDocuments = async (
  relevantDocs,
  userText,
  userEmail,
  signal,
) => {
  const summaries = [];

  for (const doc of relevantDocs) {
    let cached = await getCachedDocument(doc.id);
    if (!cached) {
      try {
        cached = await convertDocument(doc.id, userEmail, signal);
      } catch (e) {
        log('convertDocument while summarizing failed', doc.id, e.message);
      }
    }
    if (!cached?.content) continue;

    const prompt = `Kamu adalah asisten ringkasan dokumen teknis. Tugas: berikan ringkasan singkat dan fokus pada informasi yang relevan terhadap pertanyaan pengguna.\n\nFormat keluaran:\n- Judul Dokumen: ...\n- Ringkasan Relevan: ...`;

    const data = await callDeepSeek({
      temperature: 0.2,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `Pertanyaan pengguna: "${userText}"\n\nIsi dokumen:\n${cutText(
            cached.content,
            2000,
          )}`,
        },
      ],
      signal,
    });

    const summary = data?.choices?.[0]?.message?.content?.trim();
    if (summary) {
      summaries.push({
        fileId: doc.fileId || doc.id,
        title: doc.title || doc.name,
        folder: doc.folderName,
        summary,
      });
    }
  }

  return summaries;
};

const compareSummaries = async (summaries, userText, signal) => {
  const combined = summaries
    .map(s => `📄 ${s.title} (Folder: ${s.folder})\n${s.summary}\n---`)
    .join('\n\n');
  const comparisonPrompt = `Kamu adalah analis dokumen cerdas.\n\nTugas: 1) Bandingkan isi antar dokumen (kesamaan, perbedaan, kontradiksi). 2) Berikan jawaban akhir yang akurat untuk pertanyaan pengguna. 3) Sertakan referensi ringan seperti \"berdasarkan dokumen X\".\n\nPertanyaan pengguna: "${userText}"\n\nRingkasan dokumen:\n${combined}`;

  const data = await callDeepSeek({
    temperature: 0.35,
    messages: [{ role: 'system', content: comparisonPrompt }],
    signal,
  });
  return data?.choices?.[0]?.message?.content?.trim();
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
  const abortControllerRef = useRef(null);

  const preloadAllDocuments = async () => {
    try {
      const folderData = await getDriveSubfolders();
      if (!folderData?.subfolders) return;

      const folderMap = Object.fromEntries(
        folderData.subfolders.map(subfolder => [
          subfolder.name,
          subfolder.files,
        ]),
      );

      await AsyncStorage.setItem('doc-folder-map', JSON.stringify(folderMap));
      console.log('Documents cached successfully');
    } catch (err) {
      console.error('Failed to preload documents:', err);
    }
  };

  useEffect(() => {
    setMessages([
      {
        id: 'init-ai-greeting',
        text: 'Halo! Saya siap membantu Anda dengan dokumentasi.',
        sender: 'ai',
      },
    ]);

    const t = setTimeout(
      () => preloadAllDocuments().catch(e => log('preload error', e.message)),
      300,
    );

    return () => {
      clearTimeout(t);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const showStage = text => {
    startStage(text);
    addMessage({ id: `stage-${text}`, text, sender: 'ai', isStage: true });
  };
  const clearStage = () => {
    resetStage();
    setMessages(prev => prev.filter(m => !m.isStage));
  };

  const handleSendMessage = async userText => {
    addMessage({ id: Date.now().toString(), text: userText, sender: 'user' });

    const controller = createAbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    try {
      showStage('Mencari dokumen relevan...');

      const folderData = await withRetries(() => getDriveSubfolders());
      const allDocs =
        folderData?.subfolders?.flatMap(folder =>
          folder.files.map(file => ({
            ...file,
            folderName: folder.name,
            folderLink: folder.webViewLink,
          })),
        ) || [];

      if (allDocs.length === 0) {
        clearStage();
        return addMessage({
          id: `ai-${Date.now()}`,
          text: 'Tidak ada dokumen yang tersedia.',
          sender: 'ai',
        });
      }

      const relevantDocs = await retrieveRelevantDocs(
        userText,
        allDocs,
        user?.email || null,
        signal,
      );
      if (!relevantDocs || relevantDocs.length === 0) {
        clearStage();
        return addMessage({
          id: `ai-${Date.now()}`,
          text: 'Saya tidak menemukan dokumen yang relevan.',
          sender: 'ai',
        });
      }

      showStage('Membaca dokumen dan menyiapkan konteks...');
      let fullContext = '';
      for (const doc of relevantDocs) {
        const cached = await getCachedDocument(doc.id);
        if (!cached?.content) continue;
        fullContext += `\n---\nDokumen: ${doc.title || doc.name}\nFolder: ${
          doc.folderName
        }\n\n${cached.content}`;
      }

      showStage('Meringkas dokumen yang relevan...');
      const summaries = await summarizeDocuments(
        relevantDocs,
        userText,
        user?.email || null,
        signal,
      );
      if (!summaries || summaries.length === 0) {
        clearStage();
        return addMessage({
          id: `ai-${Date.now()}`,
          text: 'Tidak ada konten yang bisa diringkas dari dokumen relevan.',
          sender: 'ai',
        });
      }

      showStage('Membandingkan hasil dan menyusun jawaban akhir...');
      const finalAnswer = await compareSummaries(summaries, userText, signal);
      clearStage();

      addMessage({
        id: `ai-${Date.now()}`,
        text:
          finalAnswer ||
          'Saya tidak menemukan jawaban yang cukup relevan dari dokumen.',
        sender: 'ai',
      });
    } catch (err) {
      log('handleSendMessage error', err.message);
      clearStage();
      const isAbort =
        err?.name === 'CanceledError' ||
        err?.message?.includes('cancel') ||
        err?.code === 'ERR_CANCELED';
      addMessage({
        id: `ai-${Date.now()}`,
        text: isAbort
          ? 'Permintaan dibatalkan.'
          : 'Terjadi kesalahan saat memproses permintaan Anda.',
        sender: 'ai',
      });
    } finally {
      abortControllerRef.current = null;
    }
  };

  return (
    <ChatComponent
      messages={messages}
      loadingMessage={loadingMessage}
      onSendMessage={handleSendMessage}
      abortDeepSeekRequest={() => abortControllerRef.current?.abort()}
    />
  );
};

export default ChatContainer;
