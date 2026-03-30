import { query } from './index.js';

export async function initDB() {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      avatar_url TEXT,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
      host_id VARCHAR(255) REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      property_type VARCHAR(100),
      price_per_night DECIMAL(10, 2) NOT NULL,
      cleaning_fee DECIMAL(10, 2) DEFAULT 0,
      location_city VARCHAR(255),
      location_country VARCHAR(255),
      location_lat DECIMAL(10, 8),
      location_lng DECIMAL(11, 8),
      amenities JSONB DEFAULT '[]',
      images JSONB DEFAULT '[]',
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER REFERENCES listings(id),
      guest_id VARCHAR(255) REFERENCES users(id),
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      payment_intent_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER REFERENCES listings(id),
      guest_id VARCHAR(255) REFERENCES users(id),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await query(createTablesQuery);
}
