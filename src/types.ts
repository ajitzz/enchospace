
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
  images?: string[];
  imageCount: number;
  provider: string;
  isVerified: boolean;
  location?: string;
  discount?: number; // percentage
  isNew?: boolean;
  lat?: number; // For map simulation
  lng?: number; // For map simulation
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  details?: {
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    maxGuests?: number;
    amenities?: string[];
    [key: string]: any;
  };
  
  // Detailed fields
  description?: string;
  address?: string;
  size?: number; // sqft/sqm
  floor?: number;
  rooms?: Room[];
  nearby?: NearbyPoint[];
  maxGuests?: number;
  status?: string;
}

export interface Reservation {
  id: string;
  property_id: number;
  user_name: string;
  user_phone: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
  property_title?: string;
}

export interface SearchState {
  city: string;
  loading: boolean;
  results: Listing[];
}
