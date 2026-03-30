
export interface Room {
  id: string;
  name: string;
  price: number;
  sqft: number;
  isAvailable: boolean;
  features: string[]; // e.g., "Balcony", "En-suite"
  image?: string;
}

export interface NearbyPoint {
  name: string;
  type: 'TRANSPORT' | 'GROCERY' | 'PARK' | 'CAFE' | 'GYM';
  distance: string; // e.g., "5 min walk"
  minutes: number;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  period: string;
  type: 'APARTMENT' | 'ROOM' | 'STUDIO';
  imageUrl: string;
  imageCount: number;
  provider: string;
  isVerified: boolean;
  discount?: number; // percentage
  isNew?: boolean;
  lat?: number; // For map simulation
  lng?: number; // For map simulation
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  
  // Detailed fields
  description?: string;
  address?: string;
  size?: number; // sqft/sqm
  floor?: number;
  rooms?: Room[];
  nearby?: NearbyPoint[];
  maxGuests?: number;
}

export interface SearchState {
  city: string;
  loading: boolean;
  results: Listing[];
}
