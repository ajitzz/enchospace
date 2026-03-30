import { GoogleGenAI } from '@google/genai';
import { Listing } from '../types';

const model = 'gemini-2.5-flash';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({ apiKey });
}

function parseJsonArray(text: string): any[] {
  let clean = (text || '[]').trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  const parsed = JSON.parse(clean);
  return Array.isArray(parsed) ? parsed : [];
}

export async function generateListingsForCity(city: string): Promise<Listing[]> {
  const ai = getClient();
  const prompt = `Generate 8 high-quality rental listings for ${city}.
Include realistic neighborhood names and pricing.
Return ONLY a raw JSON array, no markdown.
Each object must include:
id (string), title (string), price (number), currency (string), period (string),
type (APARTMENT|ROOM|STUDIO), provider (string), isVerified (boolean),
discount (number), isNew (boolean), rating (number), reviewCount (number),
amenities (array of strings), address (string).`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  const items = parseJsonArray(response.text || '[]');
  return items.map((item: any) => ({
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
}

export async function generateDescription(details: {
  title: string;
  type: string;
  city: string;
  amenities: string[];
}): Promise<string> {
  const ai = getClient();
  const prompt = `Write a professional rental listing description for a ${details.type} in ${details.city} titled "${details.title}".
Amenities: ${details.amenities.join(', ')}.
Keep it clear, inviting, and 150-200 words.`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  return response.text || 'No description generated.';
}
