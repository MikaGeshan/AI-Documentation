import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Fuse from 'fuse.js';

import ChatComponent from '../Components/ChatComponent';
import { ChatAction } from '../Stores/ChatAction';
import SignInActions from '../../Authentication/Stores/SignInActions';
import { getDriveSubfolders, getDriveFileContent } from '../../../App/Google';
import { cutText } from '../../../App/Locale';
import Config from '../../../App/Network';
import { GEMINI_API_KEY, GEMINI_MODEL, GEMINI_URL, GITLAB_HOST } from '@env';

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

export let abortGeminiRequest = () => {};

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

const callGemini = async ({ messages, temperature = 0.4, signal } = {}) => {
  return withRetries(async () => {
    const controller = createAbortController();
    const fetchSignal = signal || controller.signal;

    const modelToUse = GEMINI_MODEL || 'gemini-2.0-flash';
    const urlToUse = GEMINI_URL;
    const keyToUse = GEMINI_API_KEY;

    const resp = await axios.post(
      urlToUse,
      { model: modelToUse, messages, temperature },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyToUse}`,
        },
        signal: fetchSignal,
      },
    );

    const data = resp?.data;
    if (!data) throw new Error('Empty response from Gemini');

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
    const data = await callGemini({
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
    // Clean selectedName by stripping markdown format and suffixes like " (folder: ...)"
    let cleanSelectedName = selectedName.replace(/^-\s*/, '').replace(/`/g, '').trim();
    if (cleanSelectedName.includes(' (folder: ')) {
      cleanSelectedName = cleanSelectedName.split(' (folder: ')[0];
    }

    const fuse = new Fuse(allDocs, {
      keys: ['folderName', 'name'],
      threshold: 0.5, // slightly more relaxed threshold for better matching
    });

    const results = fuse.search(cleanSelectedName);

    match = results.find(
      r => r.item.folderName?.toLowerCase() === cleanSelectedName.toLowerCase(),
    )?.item;

    if (!match) {
      match = results.find(
        r => r.item.name?.toLowerCase() === cleanSelectedName.toLowerCase(),
      )?.item;
    }

    if (!match) {
      match = results?.[0]?.item;
    }

    console.log('LLM matched:', match);

    if (match) {
      console.log('===match found', match);
      let cached = await getCachedDocument(match.id);
      if (!cached) {
        if (match.isGit) {
          try {
            const token = await AsyncStorage.getItem('gitlab_token');
            const host = GITLAB_HOST;
            const response = await axios.post(`${Config.API_URL}/api/git-file`, {
              repoUrl: match.repoUrl,
              filePath: match.filePath,
              token,
              host,
            });
            cached = { content: response.data?.content || '' };
            await setCachedDocument(match.id, cached);
          } catch (e) {
            log('Failed to fetch git file content', match.id, e.message);
          }
        } else {
          cached = await convertDocument(match.id, userEmail, signal);
        }
      }
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

  // Stage 1: Fuzzy search on file paths/names first (without downloading contents)
  const pathFuse = new Fuse(allDocs, {
    keys: ['name', 'folderName'],
    threshold: 0.5,
  });

  const topDocs = pathFuse.search(userText).slice(0, 5).map(r => r.item);

  // If no files match the path, fallback to top 3 documents to avoid returning empty
  if (topDocs.length === 0) {
    topDocs.push(...allDocs.slice(0, 3));
  }

  const chunksForSearch = [];
  for (const doc of topDocs) {
    const docId = doc.id || doc.fileId;
    let cached = await getCachedDocument(docId);
    if (!cached) {
      try {
        if (doc.isGit) {
          const token = await AsyncStorage.getItem('gitlab_token');
          const host = GITLAB_HOST;
          const response = await axios.post(`${Config.API_URL}/api/git-file`, {
            repoUrl: doc.repoUrl,
            filePath: doc.filePath,
            token,
            host,
          });
          cached = { content: response.data?.content || '' };
          await setCachedDocument(docId, cached);
        } else {
          cached = await convertDocument(docId, userEmail, signal);
        }
      } catch (e) {
        log('convertDocument failed during fallback for', docId, e.message);
      }
    }
    if (!cached?.content) continue;

    const chunks = chunkText(cached.content);
    chunks.forEach((chunk, i) =>
      chunksForSearch.push({
        fileId: docId,
        title: doc.name,
        folderName: doc.folderName,
        chunk,
        index: i,
      }),
    );
  }

  // Stage 2: Search within the text contents of only the top matched files
  const contentFuse = new Fuse(chunksForSearch, {
    includeScore: true,
    threshold: 0.4,
    keys: ['chunk'],
  });

  const results = contentFuse
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
    const docId = doc.id || doc.fileId;
    let cached = await getCachedDocument(docId);
    if (!cached) {
      try {
        if (docId?.startsWith('git:')) {
          const parts = docId.split(':');
          const repoUrl = `${parts[1]}:${parts[2]}`;
          const filePath = parts.slice(3).join(':');
          const token = await AsyncStorage.getItem('gitlab_token');
          const host = GITLAB_HOST;
          const response = await axios.post(`${Config.API_URL}/api/git-file`, {
            repoUrl,
            filePath,
            token,
            host,
          });
          cached = { content: response.data?.content || '' };
          await setCachedDocument(docId, cached);
        } else {
          cached = await convertDocument(docId, userEmail, signal);
        }
      } catch (e) {
        log('convertDocument while summarizing failed', docId, e.message);
      }
    }
    if (!cached?.content) continue;

    const prompt = `Kamu adalah asisten ringkasan dokumen teknis. Tugas: berikan ringkasan singkat dan fokus pada informasi yang relevan terhadap pertanyaan pengguna.\n\nFormat keluaran:\n- Judul Dokumen: ...\n- Ringkasan Relevan: ...`;

    const data = await callGemini({
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
  const comparisonPrompt = `Kamu adalah analis dokumen cerdas.\n\nTugas: 1) Bandingkan isi antar dokumen (kesamaan, perbedaan, kontradiksi). 2) Berikan jawaban akhir yang akurat untuk pertanyaan pengguna. 3) Sertakan referensi ringan seperti \"berdasarkan dokumen X\".`;

  const data = await callGemini({
    temperature: 0.35,
    messages: [
      { role: 'system', content: comparisonPrompt },
      { role: 'user', content: `Pertanyaan pengguna: "${userText}"\n\nRingkasan dokumen:\n${combined}` },
    ],
    signal,
  });
  return data?.choices?.[0]?.message?.content?.trim();
};

// Build a visual tree from git file paths (no LLM needed)
const buildTreeAnswer = (gitDocs, repoName) => {
  const tree = {};
  for (const doc of gitDocs) {
    const parts = doc.filePath.split('/');
    let node = tree;
    for (const part of parts) {
      if (!node[part]) node[part] = {};
      node = node[part];
    }
  }

  const renderTree = (obj, prefix = '') => {
    const keys = Object.keys(obj).sort();
    let result = '';
    keys.forEach((key, i) => {
      const isLast = i === keys.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const children = Object.keys(obj[key]);
      const isDir = children.length > 0;
      result += `${prefix}${connector}${isDir ? '📁 ' : '📄 '}${key}\n`;
      if (isDir) {
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');
        result += renderTree(obj[key], nextPrefix);
      }
    });
    return result;
  };

  return `📦 **${repoName}** — Project Structure\n\n` +
    `Total files: ${gitDocs.length}\n\n` +
    '```\n' + renderTree(tree) + '```\n\n' +
    `_Data diambil langsung dari repository GitLab._`;
};

// Detect if the question is asking about project/folder structure
const isStructureQuery = (text) => {
  const lower = text.toLowerCase();
  const keywords = ['structure', 'struktur', 'tree', 'folder', 'directory', 'arsitektur', 'architecture', 'layout', 'susunan'];
  return keywords.some(kw => lower.includes(kw));
};

const getAllDocuments = async () => {
  const folderData = await getDriveSubfolders();
  const subfolders = folderData?.subfolders ?? [];

  const foldersWithFiles = await Promise.all(
    subfolders.map(async folder => {
      const files = await getDriveFileContent(folder.id);
      return {
        ...folder,
        files: files || [],
      };
    }),
  );

  return foldersWithFiles;
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
      const foldersWithFiles = await getAllDocuments();

      const folderMap = Object.fromEntries(
        foldersWithFiles.map(subfolder => [
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

  const classifyQuery = async (userText, signal) => {
    const prompt = `Kamu adalah pengklasifikasi pertanyaan. Tugas Anda adalah menganalisis apakah pertanyaan pengguna bersifat teknis (memerlukan pembacaan dokumentasi proyek/codebase) atau bersifat umum/percakapan biasa.\n\nKlasifikasikan pertanyaan menjadi salah satu:\n- "GENERAL": Sapaan (halo, pagi), obrolan biasa, terima kasih, pertanyaan umum tentang kehidupan, atau instruksi umum yang tidak memerlukan referensi berkas proyek.\n- "TECHNICAL": Pertanyaan spesifik tentang kode program, API, konfigurasi sistem, database, alur bisnis proyek, dokumentasi di Google Drive, atau cara mengoperasikan fitur teknis.\n\nJawab HANYA dengan satu kata: "GENERAL" atau "TECHNICAL".`;

    try {
      const data = await callGemini({
        temperature: 0.1,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userText },
        ],
        signal,
      });
      const category = data?.choices?.[0]?.message?.content?.trim().toUpperCase();
      return category === 'TECHNICAL' ? 'TECHNICAL' : 'GENERAL';
    } catch (e) {
      log('classifyQuery error', e.message);
      return 'TECHNICAL'; // Fallback aman
    }
  };

  const answerGeneralQuery = async (userText, signal) => {
    const prompt = `Kamu adalah asisten AI yang ramah, sopan, dan profesional untuk aplikasi AIDocumentation. Jawab sapaan, obrolan santai, atau pertanyaan umum pengguna secara langsung dengan ramah.`;

    const data = await callGemini({
      temperature: 0.7,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userText },
      ],
      signal,
    });
    return data?.choices?.[0]?.message?.content?.trim();
  };

  const handleSendMessage = async userText => {
    addMessage({ id: Date.now().toString(), text: userText, sender: 'user' });

    const trimmedText = userText.trim().toLowerCase();
    const isSyncRequest =
      trimmedText.includes('sync') ||
      trimmedText.includes('import') ||
      trimmedText.includes('repository') ||
      trimmedText.includes('codebase') ||
      trimmedText.includes('hubungkan');

    if (isSyncRequest) {
      // Look for glpat- token in the userText
      let token = null;
      const tokenMatch = userText.match(/(glpat-[a-zA-Z0-9_-]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
        await AsyncStorage.setItem('gitlab_token', token);
      } else {
        token = await AsyncStorage.getItem('gitlab_token');
      }

      if (!token) {
        return addMessage({
          id: `ai-${Date.now()}`,
          text: 'Silakan masukkan token GitLab/GitHub Anda untuk memulai sinkronisasi. Contoh:\n`sync repo Zsmart dengan token glpat-XXXXXXXXX`',
          sender: 'ai',
        });
      }

      showStage('Menghubungkan ke server GitLab/GitHub...');
      try {
        // Extract project context (remove sync command keywords and tokens)
        let projectContext = userText
          .replace(/(glpat-[a-zA-Z0-9_-]+)/g, '')
          .replace(/sync|import|repo|codebase|repository|hubungkan/gi, '')
          .replace(/token/gi, '')
          .trim();

        if (!projectContext) {
          clearStage();
          return addMessage({
            id: `ai-${Date.now()}`,
            text: 'Silakan sebutkan nama proyek atau deskripsi repository yang ingin Anda sync.',
            sender: 'ai',
          });
        }

        // Determine custom host from env
        let host = GITLAB_HOST;
        if (userText.includes('github')) {
          host = 'api.github.com';
        } else if (userText.includes('gitlab.com')) {
          host = 'gitlab.com';
        }

        showStage(`Mencari repository yang cocok dengan "${projectContext}"...`);
        const response = await axios.post(`${Config.API_URL}/api/auto-sync`, {
          token,
          projectContext,
          host,
        });

        clearStage();
        if (response.data?.success) {
          if (response.data.chosenUrl) {
            await AsyncStorage.setItem('gitlab_active_repo', response.data.chosenUrl);
          }
          addMessage({
            id: `ai-${Date.now()}`,
            text: `✅ **Berhasil Menghubungkan Repository!**\n\nSaya telah mendeteksi repository **${response.data.chosenRepo}** dan berhasil mensinkronisasi berkas kode/dokumentasi teknis ke Google Drive Anda.\n\nSekarang Anda dapat menanyakan pertanyaan teknis tentang repository ini!`,
            sender: 'ai',
          });
        } else {
          addMessage({
            id: `ai-${Date.now()}`,
            text: `❌ **Sinkronisasi Gagal:** ${response.data?.message || 'Gagal mencocokkan repository.'}`,
            sender: 'ai',
          });
        }
        return;
      } catch (err) {
        log('sync error', err.message);
        clearStage();
        addMessage({
          id: `ai-${Date.now()}`,
          text: `❌ Terjadi kesalahan saat sinkronisasi: ${err.message}`,
          sender: 'ai',
        });
        return;
      }
    }

    const controller = createAbortController();
    abortControllerRef.current = controller;
    abortGeminiRequest = () => controller.abort();
    const signal = controller.signal;

    try {
      showStage('Menganalisis pertanyaan...');
      const queryType = await classifyQuery(userText, signal);
      console.log('Query Type:', queryType);

      if (queryType === 'GENERAL') {
        showStage('Memikirkan jawaban...');
        const directAnswer = await answerGeneralQuery(userText, signal);
        clearStage();
        addMessage({
          id: `ai-${Date.now()}`,
          text: directAnswer || 'Ada yang bisa saya bantu?',
          sender: 'ai',
        });
        return;
      }

      showStage('Mencari dokumen relevan...');

      const foldersWithFiles = await withRetries(() => getAllDocuments());
      const driveDocs =
        foldersWithFiles.flatMap(folder =>
          folder.files.map(file => ({
            ...file,
            folderName: folder.name,
            folderLink: folder.webViewLink,
          })),
        ) || [];

      let allDocs = [...driveDocs];

      // Load files from linked GitLab/GitHub repository on-the-fly
      const activeRepo = await AsyncStorage.getItem('gitlab_active_repo');
      const gitToken = await AsyncStorage.getItem('gitlab_token');
      try {
        const payload = {};
        if (activeRepo && gitToken) {
          payload.repoUrl = activeRepo;
          payload.token = gitToken;
          payload.host = GITLAB_HOST;
        }

        const gitResponse = await axios.post(`${Config.API_URL}/api/git-tree`, payload);

        if (gitResponse.data?.success && Array.isArray(gitResponse.data.files)) {
          const matchedRepoUrl = gitResponse.data.repoUrl || activeRepo || 'default-repo';
          const repoName = matchedRepoUrl.split('/').pop() || 'Repo';
          const gitDocs = gitResponse.data.files.map(file => ({
            id: `git:${matchedRepoUrl}:${file.path}`,
            name: file.path,
            title: file.path,
            folderName: `Git: ${repoName}`,
            isGit: true,
            repoUrl: matchedRepoUrl,
            filePath: file.path,
          }));
          allDocs = [...allDocs, ...gitDocs];
          console.log(`Merged ${gitDocs.length} files from repository: ${repoName}`);
        }
      } catch (gitErr) {
        log('Error loading git codebase tree', gitErr.message);
      }

      // Fast-path: if the user is asking about project structure and we have git files,
      // build the answer directly from the file tree — no LLM needed
      const gitFiles = allDocs.filter(d => d.isGit);
      if (isStructureQuery(userText) && gitFiles.length > 0) {
        const repoName = gitFiles[0].repoUrl?.split('/').pop() || 'Repository';
        clearStage();
        return addMessage({
          id: `ai-${Date.now()}`,
          text: buildTreeAnswer(gitFiles, repoName),
          sender: 'ai',
        });
      }

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
      let summaries = [];
      try {
        summaries = await summarizeDocuments(
          relevantDocs,
          userText,
          user?.email || null,
          signal,
        );
      } catch (sumErr) {
        log('summarizeDocuments failed (likely 429)', sumErr.message);
      }

      // If LLM summarization failed (e.g. 429), build a direct answer from raw content
      if (!summaries || summaries.length === 0) {
        clearStage();
        if (fullContext.trim()) {
          const truncated = cutText(fullContext, 3000);
          return addMessage({
            id: `ai-${Date.now()}`,
            text: `Berikut konten dokumen yang relevan:\n\n${truncated}\n\n_⚠️ AI sedang rate-limited, menampilkan konten mentah._`,
            sender: 'ai',
          });
        }
        return addMessage({
          id: `ai-${Date.now()}`,
          text: 'Tidak ada konten yang bisa diringkas dari dokumen relevan.',
          sender: 'ai',
        });
      }

      showStage('Membandingkan hasil dan menyusun jawaban akhir...');
      let finalAnswer = null;
      try {
        finalAnswer = await compareSummaries(summaries, userText, signal);
      } catch (compErr) {
        log('compareSummaries failed (likely 429)', compErr.message);
        // Fallback: concatenate summaries directly
        finalAnswer = summaries.map(s => `📄 **${s.title}** (${s.folder})\n${s.summary}`).join('\n\n---\n\n');
      }
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
      abortGeminiRequest={() => abortControllerRef.current?.abort()}
    />
  );
};

export default ChatContainer;
