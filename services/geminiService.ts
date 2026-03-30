import { Listing } from "../types";

const fallbackListingsForCity = (city: string): Listing[] => [
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

const hydrateListings = (rows: any[], city: string): Listing[] =>
  rows.map((item: any) => ({
    ...item,
    imageCount: Number(item.imageCount) || 5,
    imageUrl: item.imageUrl || `https://picsum.photos/seed/${item.id}A/800/600`,
    lat: typeof item.lat === "number" ? item.lat : 50 + Math.random() * 40,
    lng: typeof item.lng === "number" ? item.lng : 10 + Math.random() * 40,
    rating: Number(item.rating) || 4.5,
    reviewCount: Number(item.reviewCount) || Math.floor(Math.random() * 100),
    amenities: Array.isArray(item.amenities) ? item.amenities : ["Wifi", "Kitchen", "Heating"],
    address: item.address || `${item.title || "Rental"}, ${city}`,
  }));

export const fetchListingsForCity = async (city: string): Promise<Listing[]> => {
  try {
    const response = await fetch(`/api/ai/listings?city=${encodeURIComponent(city)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch AI listings: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return fallbackListingsForCity(city);
    }

    return hydrateListings(data, city);
  } catch (error) {
    console.error("AI Listings Error:", error);
    return fallbackListingsForCity(city);
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

    if (!response.ok) {
      throw new Error(`Failed to generate description: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "No description generated.";
  } catch (error) {
    console.error("AI Description Error:", error);
    return `A beautiful ${details.type} located in the heart of ${details.city}. Featuring ${details.amenities.join(", ")}, this space is perfect for your next stay.`;
  }
};
