import { Listing } from "../types";

export const fetchListingsForCity = async (city: string): Promise<Listing[]> => {
  try {
    const response = await fetch(`/api/ai/listings?city=${encodeURIComponent(city)}`);
    if (!response.ok) throw new Error("Failed to fetch AI listings");
    return await response.json();
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

export const generateListingDescription = async (details: {
  title: string;
  type: string;
  city: string;
  amenities: string[];
}): Promise<string> => {
  try {
    const response = await fetch("/api/ai/description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    if (!response.ok) throw new Error("Failed to generate AI description");
    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error("Gemini Description Error:", error);
    return `A beautiful ${details.type} located in the heart of ${details.city}. Featuring ${details.amenities.join(", ")}, this space is perfect for your next stay.`;
  }
};
