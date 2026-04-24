// backend/hfClient.js
import fetch from 'node-fetch';

const HF_API_URL =
  'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english';

const HF_API_TOKEN = process.env.HF_API_TOKEN; // put token in .env

export async function hfSentiment(text) {
  if (!text || !text.trim()) return 0.5;

  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!res.ok) {
    console.error('HF API error', res.status);
    return 0.5;
  }

  const data = await res.json();
  const first = Array.isArray(data) ? data[0] : data;
  // model returns label + score, e.g. [{label:'POSITIVE', score:0.98}][web:43][web:44]
  const score = first?.score ?? 0.5;
  return first.label === 'NEGATIVE' ? 1 - score : score; // map to 0..1
}
