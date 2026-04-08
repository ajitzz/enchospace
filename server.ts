import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import { Redis } from '@upstash/redis';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4cbpQjKtym9n@ep-small-smoke-a1vjxk25-pooler.ap-southeast-1.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

// Initialize Redis (Upstash)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://dummy-url.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'dummy-token',
});

// Initialize S3
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health/db', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (error) {
      console.error('DB Health Check Failed:', error);
      res.status(500).json({ status: 'error', message: 'DB connection failed' });
    }
  });

  // Init DB schema
  app.post('/api/init-db', async (req, res) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS listings (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL NOT NULL,
          currency VARCHAR(10) DEFAULT 'USD',
          type VARCHAR(50) NOT NULL,
          address VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      res.json({ status: 'ok', message: 'DB initialized' });
    } catch (error) {
      console.error('DB Init Failed:', error);
      res.status(500).json({ status: 'error', error: String(error) });
    }
  });

  // Get presigned URL for S3 upload
  app.post('/api/upload-url', async (req, res) => {
    try {
      const { filename, contentType } = req.body;
      if (!filename || !contentType) {
        return res.status(400).json({ error: 'filename and contentType are required' });
      }

      // If dummy credentials, just return a mock URL
      if (process.env.AWS_ACCESS_KEY_ID === 'dummy' || !process.env.AWS_ACCESS_KEY_ID) {
        return res.json({
          uploadUrl: 'https://mock-s3-url.com/upload',
          fileUrl: `https://picsum.photos/seed/${Math.random()}/800/600`,
        });
      }

      const key = `listings/${Date.now()}-${filename}`;
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || 'my-bucket',
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      res.json({ uploadUrl, fileUrl });
    } catch (error) {
      console.error('Presigned URL Error:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  // Create listing
  app.post('/api/listings', async (req, res) => {
    try {
      const { title, description, price, type, address, city, imageUrl } = req.body;
      
      // Validate
      if (!title || !price || !type || !address || !city) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Insert into DB
      const result = await pool.query(
        `INSERT INTO listings (title, description, price, type, address, city, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [title, description, price, type, address, city, imageUrl]
      );

      const newListing = result.rows[0];

      // Invalidate cache
      try {
        await redis.del(`listings:${city.toLowerCase()}`);
      } catch (e) {
        console.warn('Redis cache invalidation failed', e);
      }

      res.status(201).json(newListing);
    } catch (error) {
      console.error('Create Listing Error:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  });

  // Get listings (cache-first)
  app.get('/api/listings', async (req, res) => {
    try {
      const city = (req.query.city as string) || 'Berlin';
      const cacheKey = `listings:${city.toLowerCase()}`;

      // Try cache
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.json(cached);
        }
      } catch (e) {
        console.warn('Redis cache read failed', e);
      }

      // DB fallback
      const result = await pool.query(
        'SELECT * FROM listings WHERE city ILIKE $1 ORDER BY created_at DESC',
        [city]
      );

      const listings = result.rows.map(row => ({
        id: String(row.id),
        title: row.title,
        description: row.description,
        price: parseFloat(row.price),
        currency: row.currency,
        type: row.type,
        address: row.address,
        city: row.city,
        imageUrl: row.image_url || `https://picsum.photos/seed/${row.id}/800/600`,
        imageCount: 1,
        provider: 'Host',
        isVerified: true,
        discount: 0,
        rating: 5.0,
        reviewCount: 0,
        amenities: ['Wifi', 'Kitchen'],
      }));

      // Set cache
      try {
        await redis.set(cacheKey, JSON.stringify(listings), { ex: 3600 });
      } catch (e) {
        console.warn('Redis cache write failed', e);
      }

      res.json(listings);
    } catch (error) {
      console.error('Get Listings Error:', error);
      res.status(500).json({ error: 'Failed to get listings' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
