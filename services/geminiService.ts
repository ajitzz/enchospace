import { GoogleGenAI } from "@google/genai";
import { Listing } from "../types";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

export const fetchListingsForCity = async (city: string): Promise<Listing[]> => {
  try {
    const ai = getGenAI();
    const model = "gemini-2.0-flash";
    const prompt = `Generate 8 high-quality rental listings for ${city}. 
    Use Google Maps to find real neighborhoods and realistic pricing.
    Include a mix of modern apartments and cozy rooms. 
    Some should have discounts (between 10% and 30%). 
    Some should be "Verified". 
    Include realistic ratings (3.5 to 5.0) and review counts.
    Include 2-3 amenities per listing (e.g., Wifi, Kitchen, Gym).
    Prices should be realistic market rates for ${city} in appropriate currency (EUR for Europe, USD for US/International).
    
    Return a JSON array of objects with these properties:
    id (string), title (string), price (number), currency (string), period (string), type (APARTMENT, ROOM, or STUDIO), provider (string), isVerified (boolean), discount (number), isNew (boolean), rating (number), reviewCount (number), amenities (array of strings), address (string).`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const textResponse = response.text || "[]";
    const data = JSON.parse(textResponse);

    // Hydrate with client-side only data (images, map coords)
    return data.map((item: Record<string, unknown>) => ({
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
      amenities: item.amenities || ["Wifi", "Kitchen", "Heating"],
      address: item.address || `${item.title}, ${city}`
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
        amenities: ["Wifi", "AC", "Kitchen"],
        address: `Central District, ${city}`
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
        amenities: ["Wifi", "Balcony"],
        address: `Park Avenue, ${city}`
      },
    ];
  }
};