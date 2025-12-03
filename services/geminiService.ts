import { GoogleGenAI, Type } from "@google/genai";
import { Listing } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchListingsForCity = async (city: string): Promise<Listing[]> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `Generate 8 high-quality rental listings for ${city}. 
    Include a mix of modern apartments and cozy rooms. 
    Some should have discounts (between 10% and 30%). 
    Some should be "Verified". 
    Include realistic ratings (3.5 to 5.0) and review counts.
    Include 2-3 amenities per listing (e.g., Wifi, Kitchen, Gym).
    Prices should be realistic market rates for ${city} in appropriate currency (EUR for Europe, USD for US/International).
    Return a JSON array.`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING, description: "Street name, District, or catchy title" },
              price: { type: Type.NUMBER },
              currency: { type: Type.STRING, description: "Symbol like € or $" },
              period: { type: Type.STRING, description: "e.g. month" },
              type: { type: Type.STRING, enum: ["APARTMENT", "ROOM", "STUDIO"] },
              provider: { type: Type.STRING, description: "Agency name like Blueground" },
              isVerified: { type: Type.BOOLEAN },
              discount: { type: Type.NUMBER, description: "Optional percentage integer" },
              isNew: { type: Type.BOOLEAN },
              rating: { type: Type.NUMBER },
              reviewCount: { type: Type.INTEGER },
              amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["id", "title", "price", "type", "provider"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");

    // Hydrate with client-side only data (images, map coords)
    return data.map((item: any, index: number) => ({
      ...item,
      imageCount: 5,
      // Using specific keywords to get nicer architecture/interior shots
      imageUrl: `https://picsum.photos/seed/${item.id}A/800/600`,
      // Mock coordinates for the visual map centered roughly on the canvas
      lat: 50 + (Math.random() * 40),
      lng: 10 + (Math.random() * 40),
      // Fallbacks if AI omits them
      rating: item.rating || 4.5,
      reviewCount: item.reviewCount || Math.floor(Math.random() * 100),
      amenities: item.amenities || ["Wifi", "Kitchen", "Heating"]
    }));

  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback data
    return [
      {
        id: "1",
        title: "Modern Loft in Center",
        price: 1450,
        currency: "€",
        period: "month",
        type: "APARTMENT",
        imageUrl: "https://picsum.photos/seed/fallback1/800/600",
        imageCount: 5,
        provider: "Blueground",
        isVerified: true,
        discount: 0,
        rating: 4.8,
        reviewCount: 42,
        amenities: ["Wifi", "AC", "Kitchen"]
      },
      {
        id: "2",
        title: "Cozy Studio near Park",
        price: 980,
        currency: "€",
        period: "month",
        type: "STUDIO",
        imageUrl: "https://picsum.photos/seed/fallback2/800/600",
        imageCount: 4,
        provider: "Spotahome",
        isVerified: false,
        discount: 15,
        rating: 4.2,
        reviewCount: 12,
        amenities: ["Wifi", "Balcony"]
      },
    ];
  }
};