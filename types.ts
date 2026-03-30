
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
  city?: string;
  
  // Detailed fields
  description?: string;
  address?: string;
  size?: number; // sqft/sqm
  floor?: number;
  rooms?: Room[];
  nearby?: NearbyPoint[];
  maxGuests?: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  favorites: string[];
  createdAt: any;
}

export interface Reservation {
  id: string;
  listingId: string;
  userId: string;
  listing: Listing; // Hydrated for UI
  moveInDate: string;
  configuration?: string;
  name?: string;
  phone?: string;
  totalRent: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookingDate: string;
}

export interface AdminStats {
  totalListings: number;
  totalReservations: number;
  totalRevenue: number;
  activeUsers: number;
}
