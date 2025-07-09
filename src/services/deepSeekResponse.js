import axios from 'axios';
import { DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_URL } from '@env';
import { getFolderContents, convertDocument } from './documentProcess';
import { greetingsAndListApp } from '../utils/greetings';
import { getCachedDocument, cacheDocument } from './documentCacheManager';
import { cutText, detectMentionedApps, extractAppNames } from '../utils/text';
import { GetAppListQuery, isAppListQuery } from '../utils/appListQuery';

const MAX_DOCS = 4;

const SYSTEM_PROMPT = (docs, userMessage) => `
Berikut ini adalah bagian-bagian dari dokumentasi aplikasi yang relevan dengan pertanyaan user:

${docs
  .map(
    doc => `### Dokumen: ${doc.title || 'Tanpa Judul'}
Link: ${doc.url}

${cutText(doc.content)}`,
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

export const deepSeekResponse = async originalUserMessage => {
  try {
    let userMessage = originalUserMessage.trim();

    const earlyResponse = await greetingsAndListApp(userMessage);

    // console.log('earlyResponse:', earlyResponse);

    if (earlyResponse) return earlyResponse;

    const documents = await getFolderContents();
    if (!Array.isArray(documents) || documents.length === 0)
      return 'No documents available.';

    const appNames = extractAppNames(documents);

    const mentionedApps = detectMentionedApps(userMessage, appNames);
    if (mentionedApps.length === 0)
      return 'No Applications base on your questions .';

    const matchedDocs = documents
      .filter(doc =>
        mentionedApps.some(app =>
          doc.name.toLowerCase().includes(app.toLowerCase()),
        ),
      )
      .slice(0, MAX_DOCS);

    if (matchedDocs.length === 0)
      return 'No document matched on your question.';

    const docChunks = [];
    for (const doc of matchedDocs) {
      const url = doc.downloadUrl;
      if (!url || !url.startsWith('http')) {
        console.warn('Lewatkan dokumen tanpa URL valid:', doc.name);
        continue;
      }

      const cached = await getCachedDocument(url);
      if (cached) {
        docChunks.push(cached);
        continue;
      }

      const converted = await convertDocument(url);
      if (converted?.content) {
        await cacheDocument(url, converted);
        docChunks.push(converted);
      }
    }

    if (docChunks.length === 0) return 'Gagal memproses isi dokumen.';

    const prompt = SYSTEM_PROMPT(docChunks, userMessage);
    console.log('Prompt Length:', prompt.length, 'chars');

    const { data } = await axios.post(
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
          { role: 'user', content: prompt },
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

    const finalAnswer = data?.choices?.[0]?.message?.content?.trim();
    console.log('AI Final Answer:', finalAnswer);
    return finalAnswer || 'Tidak ada jawaban yang dihasilkan dari dokumen.';
  } catch (err) {
    console.error('DeepSeek Response error:', err.message);
    return 'Terjadi kesalahan saat memproses permintaan Anda.';
  }
};
