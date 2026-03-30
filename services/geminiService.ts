import { Listing } from "../types";

const API_BASE_URL = process.env.VITE_API_BASE_URL || "";

const withFallbackImages = (items: any[], city: string): Listing[] => {
  return items.map((item: any) => ({
    ...item,
    imageCount: item.imageCount || 5,
    imageUrl: item.imageUrl || `https://picsum.photos/seed/${item.id}A/800/600`,
    lat: item.lat || 50 + (Math.random() * 40),
    lng: item.lng || 10 + (Math.random() * 40),
    rating: item.rating || 4.5,
    reviewCount: item.reviewCount || Math.floor(Math.random() * 100),
    amenities: item.amenities || ["Wifi", "Kitchen", "Heating"],
    address: item.address || `${item.title}, ${city}`,
  }));
};

export const fetchListingsForCity = async (city: string): Promise<Listing[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/listings?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const payload = await response.json();
    const listings = Array.isArray(payload?.listings) ? payload.listings : [];

    return withFallbackImages(listings, city);
  } catch (error) {
    console.error("Gemini API Error:", error);

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
        address: `Central District, ${city}`,
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
        address: `Park Avenue, ${city}`,
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
    const response = await fetch(`${API_BASE_URL}/api/ai/description`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(details),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const payload = await response.json();
    return payload.description || "No description generated.";
  } catch (error) {
    console.error("Gemini Description Error:", error);
    return `A beautiful ${details.type} located in the heart of ${details.city}. Featuring ${details.amenities.join(", ")}, this space is perfect for your next stay.`;
  }
};
