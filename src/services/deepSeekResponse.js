import axios from 'axios';
import { DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_URL } from '@env';
import { getFolderContents, convertDocument } from './documentProcess';
import { isGreeting } from '../utils/greetings';
import { isAppListQuery, GetAppListQuery } from '../utils/appListQuery';
import { cacheDocument, getCachedDocument } from './documentCacheManager';

const MAX_DOCS = 4;
const MAX_TEXT_PER_DOC = 2000;

const truncateText = (text, maxLength = MAX_TEXT_PER_DOC) =>
  text.length > maxLength ? text.slice(0, maxLength) + '...' : text;

const extractAppNames = documents => {
  const rawNames = documents.flatMap(doc => {
    const name = doc.name?.split('.')[0] || '';
    const folder = doc.folder || '';
    return [name, folder];
  });

  const cleaned = rawNames
    .map(name =>
      name
        .replace(/[_-]/g, ' ')
        .replace(/\b(Doc|Documentation|Manual|Guide)\b/gi, '')
        .trim(),
    )
    .filter(Boolean);

  return [...new Set(cleaned)];
};

const detectMentionedApps = (userMessage, appNames) => {
  const lowerMsg = userMessage.toLowerCase();
  return appNames.filter(name => lowerMsg.includes(name.toLowerCase()));
};

export const deepSeekResponse = async userMessage => {
  try {
    if (isGreeting(userMessage)) {
      return 'Halo! Ada yang bisa saya bantu untuk mencarikan dokumentasi aplikasi dari divisi Front End Mobile? 😊';
    }
    if (isAppListQuery(userMessage)) {
      return await GetAppListQuery(userMessage);
    }

    const documents = await getFolderContents();
    if (!Array.isArray(documents) || documents.length === 0) {
      return 'Tidak ada dokumen yang tersedia.';
    }

    const appNames = extractAppNames(documents);
    const mentionedApps = detectMentionedApps(userMessage, appNames);

    if (mentionedApps.length === 0) {
      return 'Tidak ditemukan nama aplikasi dalam pertanyaan Anda.';
    }

    const matchedDocs = documents
      .filter(doc =>
        mentionedApps.some(app =>
          doc.name.toLowerCase().includes(app.toLowerCase()),
        ),
      )
      .slice(0, MAX_DOCS);

    if (matchedDocs.length === 0) {
      return 'Tidak ada dokumen yang cocok dengan aplikasi yang disebut.';
    }

    const combinedTextParts = [];
    for (const doc of matchedDocs) {
      const url = doc.downloadUrl;
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        console.warn('Lewatkan dokumen tanpa URL valid:', doc.name);
        continue;
      }

      let cached = await getCachedDocument(url);
      if (!cached) {
        cached = await convertDocument(url);
        if (cached?.content) {
          await cacheDocument(url, cached);
        }
      }

      combinedTextParts.push(cached);
    }

    if (combinedTextParts.length === 0) {
      return 'Gagal memproses isi dokumen.';
    }

    // Build prompt
    const finalPrompt = `
Berikut ini adalah bagian-bagian dari dokumentasi aplikasi yang relevan dengan pertanyaan user:

${combinedTextParts
  .map(
    doc => `### Dokumen: ${doc.title || 'Tanpa Judul'}
Link: ${doc.url}

${truncateText(doc.content)}`,
  )
  .join('\n\n')}

---

Pertanyaan user:
"${userMessage}"

Petunjuk untuk menjawab:
- Jawablah *hanya berdasarkan informasi dari dokumen-dokumen di atas*.
- Jika pertanyaan menyebut lebih dari satu aplikasi, bandingkan berdasarkan fitur, fungsi, atau kelebihan/kekurangan yang ada di dokumen.
- Sebutkan nama aplikasi dan/atau nama dokumen saat menjawab agar jelas referensinya.
- Gunakan **bullet point** atau **tabel perbandingan** bila cocok.
- Jangan menambahkan informasi yang tidak ada di dokumen (hindari asumsi atau generalisasi).
`;

    console.log('Prompt Length:', finalPrompt.length, 'chars');

    // Call DeepSeek API
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: `Kamu adalah asisten dokumentasi teknis yang cerdas dan efisien. 
Tugasmu:
- Menjawab pertanyaan hanya berdasarkan dokumen yang diberikan.
- Bila pertanyaannya membandingkan dua atau lebih aplikasi, bantu bandingkan dari sisi fitur, fungsi, kelebihan/kekurangan, atau detail teknis lainnya.
- Jawaban harus singkat, jelas, dan relevan. Hindari isi yang tidak terkait langsung.`,
          },
          { role: 'user', content: finalPrompt },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      },
    );

    const finalAnswer = response.data?.choices?.[0]?.message?.content?.trim();
    console.log('AI Final Answer:', finalAnswer);
    return finalAnswer || 'Tidak ada jawaban yang dihasilkan dari dokumen.';
  } catch (error) {
    console.error('deep seek response error:', error.message);
    return 'Terjadi kesalahan saat memproses permintaan Anda.';
  }
};
