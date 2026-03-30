import { GoogleGenAI } from '@google/genai';

function parseJsonArray(text) {
  let clean = (text || '[]').trim();
  if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (clean.startsWith('```')) clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');

  const parsed = JSON.parse(clean);
  return Array.isArray(parsed) ? parsed : [];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const city = req.query.city || 'Berlin';
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 8 high-quality rental listings for ${city}. Return only JSON array with id,title,price,currency,period,type,provider,isVerified,discount,isNew,rating,reviewCount,amenities,address.`
    });

    const items = parseJsonArray(response.text || '[]').map((item) => ({
      ...item,
      imageCount: 5,
      imageUrl: `https://picsum.photos/seed/${item.id ?? Math.random()}/800/600`,
      lat: 50 + (Math.random() * 40),
      lng: 10 + (Math.random() * 40),
      rating: item.rating || 4.5,
      reviewCount: item.reviewCount || Math.floor(Math.random() * 100),
      amenities: item.amenities || ['Wifi', 'Kitchen', 'Heating'],
      address: item.address || `${item.title || 'Apartment'}, ${city}`,
    }));

    return res.status(200).json(items);
  } catch (error) {
    console.error('Vercel AI listings error:', error);
    return res.status(500).json({ error: 'Failed to generate listings' });
  }
}
