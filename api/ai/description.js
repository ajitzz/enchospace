import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

  const { title, type, city, amenities } = req.body || {};
  if (!title || !type || !city || !Array.isArray(amenities)) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a professional rental listing description for a ${type} in ${city} titled "${title}". Amenities: ${amenities.join(', ')}. Keep it 150-200 words.`
    });

    return res.status(200).json({ description: response.text || 'No description generated.' });
  } catch (error) {
    console.error('Vercel AI description error:', error);
    return res.status(500).json({ error: 'Failed to generate description' });
  }
}
