import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, type, city, amenities } = req.body || {};

  if (!title || !type || !city || !Array.isArray(amenities)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const fallbackText = `A beautiful ${type} located in the heart of ${city}. Featuring ${amenities.join(", ")}, this space is perfect for your next stay.`;

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(200).json({ text: fallbackText });
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const prompt = `Write a professional, high-converting rental listing description for a ${type} in ${city} titled "${title}".
The space includes these amenities: ${amenities.join(", ")}.
The description should be inviting, highlight location and features, and be about 150-200 words.`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return res.status(200).json({ text: response.text || fallbackText });
  } catch (error) {
    console.error("AI description API error:", error);
    return res.status(200).json({ text: fallbackText });
  }
}
