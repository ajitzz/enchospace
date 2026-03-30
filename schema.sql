-- ENCHO Space Database Schema (Neon Postgres)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Added for custom auth
  display_name TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'admin', 'super_admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Listings Table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT REFERENCES users(uid),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT '€',
  period TEXT DEFAULT 'month', -- 'day', 'week', 'month'
  type TEXT NOT NULL, -- 'APARTMENT', 'ROOM', 'STUDIO'
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  amenities TEXT[], -- Array of amenities
  image_url TEXT,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  user_id TEXT REFERENCES users(uid),
  move_in_date DATE NOT NULL,
  total_rent DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  payment_id TEXT,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Favorites Table (Wishlist)
CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT REFERENCES users(uid),
  listing_id UUID REFERENCES listings(id),
  PRIMARY KEY (user_id, listing_id)
);
