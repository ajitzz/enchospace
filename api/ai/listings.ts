import { GoogleGenAI } from "@google/genai";

const fallbackListingsForCity = (city: string) => [
  {
    id: `fallback-${city.toLowerCase()}-1`,
    title: `Modern Loft in ${city}`,
    price: 1450,
    currency: "€",
    period: "month",
    type: "APARTMENT",
    provider: "Blueground",
    isVerified: true,
    discount: 0,
    isNew: true,
    rating: 4.8,
    reviewCount: 42,
    amenities: ["Wifi", "AC", "Kitchen"],
    address: `Central District, ${city}`,
  },
  {
    id: `fallback-${city.toLowerCase()}-2`,
    title: `Cozy Studio near Park (${city})`,
    price: 980,
    currency: "€",
    period: "month",
    type: "STUDIO",
    provider: "Spotahome",
    isVerified: false,
    discount: 15,
    isNew: false,
    rating: 4.2,
    reviewCount: 12,
    amenities: ["Wifi", "Balcony", "Heating"],
    address: `Park Avenue, ${city}`,
  },
];

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cityParam = typeof req.query?.city === "string" ? req.query.city : "Berlin";
  const city = cityParam.trim() || "Berlin";

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(200).json(fallbackListingsForCity(city));
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const prompt = `Generate 8 high-quality rental listings for ${city}. 
Use real neighborhoods and realistic pricing.
Include a mix of APARTMENT, ROOM, and STUDIO entries.
Some should have discounts (between 10% and 30%).
Some should be verified.
Include realistic ratings (3.5 to 5.0) and review counts.
Include 2-3 amenities per listing.
Return ONLY a raw JSON array with keys:
id, title, price, currency, period, type, provider, isVerified, discount, isNew, rating, reviewCount, amenities, address.`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    let textResponse = (response.text || "[]").trim();

    if (textResponse.startsWith("```json")) {
      textResponse = textResponse.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    } else if (textResponse.startsWith("```")) {
      textResponse = textResponse.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    const parsed = JSON.parse(textResponse);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return res.status(200).json(fallbackListingsForCity(city));
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("AI listings API error:", error);
    return res.status(200).json(fallbackListingsForCity(city));
  }
}
