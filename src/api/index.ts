import { Router } from 'express';
import { query } from '../db/index.js';
import { getCached, setCached } from '../db/redis.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Stripe from 'stripe';
import whatsappRoutes from './whatsapp.js';

const router = Router();

// Mount WhatsApp webhook route
router.use('/whatsapp', whatsappRoutes);

// Mock Stripe for now, replace with real key in production
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2026-03-25.dahlia',
});

// S3 Client (Mocked credentials for preview, replace with real in production)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock_secret',
  },
});

// --- LISTINGS API ---

router.get('/listings', async (req, res) => {
  try {
    const { city } = req.query;
    const cacheKey = `listings:${city || 'all'}`;
    
    // Try cache first
    const cachedListings = await getCached(cacheKey);
    if (cachedListings) {
      return res.json(cachedListings);
    }

    let sql = 'SELECT * FROM listings WHERE status = $1';
    let params: any[] = ['active'];

    if (city) {
      sql += ' AND location_city ILIKE $2';
      params.push(`%${city}%`);
    }

    const result = await query(sql, params);
    
    // Set cache
    await setCached(cacheKey, result.rows, 300); // Cache for 5 minutes
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/listings', async (req, res) => {
  try {
    const { host_id, title, description, property_type, price_per_night, location_city, amenities, images } = req.body;
    
    const sql = `
      INSERT INTO listings (host_id, title, description, property_type, price_per_night, location_city, amenities, images, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [host_id, title, description, property_type, price_per_night, location_city, JSON.stringify(amenities), JSON.stringify(images), 'active'];
    
    const result = await query(sql, params);
    
    // Invalidate cache
    await setCached(`listings:all`, null, 1);
    await setCached(`listings:${location_city}`, null, 1);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- UPLOAD API (Pre-signed URLs) ---

router.post('/upload/presigned-url', async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    const key = `uploads/${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'my-app-bucket',
      Key: key,
      ContentType: contentType,
    });

    // In a real environment with valid AWS credentials, this generates a URL.
    // For this preview without real AWS keys, we'll return a mock URL or attempt it.
    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        res.json({ uploadUrl: signedUrl, key });
    } catch (awsError) {
        // Fallback for preview environment without AWS credentials
        res.json({ 
            uploadUrl: 'mock-url', 
            key, 
            mock: true,
            publicUrl: `https://picsum.photos/seed/${filename}/800/600` 
        });
    }
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PAYMENTS API ---

router.post('/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', listingId } = req.body;
    
    // Create a PaymentIntent with the order amount and currency
    // Using mock for preview if no real key
    if ((process.env.STRIPE_SECRET_KEY || 'sk_test_mock') === 'sk_test_mock') {
        return res.json({
            clientSecret: 'mock_client_secret_12345',
            mock: true
        });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency,
      metadata: { listingId: String(listingId) }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
