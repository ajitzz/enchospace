import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import Stripe from "stripe";
import Redis from "ioredis";
import cron from "node-cron";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

// Database Connection (Neon)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Redis Connection (Upstash)
const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis(process.env.UPSTASH_REDIS_REST_URL) 
  : null;

// Stripe Initialization
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: false,
}));
app.use(express.json({ limit: "50kb" }));

const rateLimitWindowMs = 15 * 60 * 1000;
const maxApiRequestsPerWindow = 200;
const requestCounts = new Map<string, { count: number; resetAt: number }>();
app.use("/api", (req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = requestCounts.get(key);

  if (!current || now > current.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return next();
  }

  if (current.count >= maxApiRequestsPerWindow) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    res.setHeader("Retry-After", retryAfterSeconds.toString());
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  current.count += 1;
  requestCounts.set(key, current);
  return next();
});

const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// --- API ROUTES ---

// 1. Listings API
app.get("/api/listings", async (req, res) => {
  try {
    const city = req.query.city as string;
    const cacheKey = `listings:${city || 'all'}`;

    // Try Redis Cache first
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    let query = "SELECT * FROM listings ORDER BY created_at DESC";
    let values: any[] = [];
    if (city) {
      query = "SELECT * FROM listings WHERE city ILIKE $1 ORDER BY created_at DESC";
      values = [city];
    }

    const result = await pool.query(query, values);
    
    // Cache for 1 hour
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result.rows), "EX", 3600);
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/listings", async (req, res) => {
  try {
    const { title, description, price, currency, period, type, city, address, amenities, imageUrl, ownerId, bedrooms, bathrooms, maxGuests, size } = req.body;
    const query = `
      INSERT INTO listings (title, description, price, currency, period, type, city, address, amenities, image_url, owner_id, bedrooms, bathrooms, max_guests, size)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const values = [title, description, price, currency, period, type, city, address, amenities, imageUrl, ownerId, bedrooms, bathrooms, maxGuests, size];
    const result = await pool.query(query, values);
    
    // Invalidate cache
    if (redis) {
      const keys = await redis.keys('listings:*');
      if (keys.length > 0) await redis.del(...keys);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create Listing Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/listings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, currency, period, type, city, address, amenities, imageUrl, bedrooms, bathrooms, maxGuests, size } = req.body;
    const query = `
      UPDATE listings 
      SET title = $1, description = $2, price = $3, currency = $4, period = $5, type = $6, city = $7, address = $8, amenities = $9, image_url = $10, bedrooms = $11, bathrooms = $12, max_guests = $13, size = $14
      WHERE id = $15
      RETURNING *
    `;
    const values = [title, description, price, currency, period, type, city, address, amenities, imageUrl, bedrooms, bathrooms, maxGuests, size, id];
    const result = await pool.query(query, values);
    
    if (redis) {
      const keys = await redis.keys('listings:*');
      if (keys.length > 0) await redis.del(...keys);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update Listing Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/listings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM listings WHERE id = $1", [id]);
    
    if (redis) {
      const keys = await redis.keys('listings:*');
      if (keys.length > 0) await redis.del(...keys);
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete Listing Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. Reservations API
app.get("/api/reservations", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    let query = `
      SELECT r.*, l.title as listing_title, l.image_url as listing_image, l.address as listing_address
      FROM reservations r
      JOIN listings l ON r.listing_id = l.id
    `;
    let values: any[] = [];
    if (userId) {
      query += " WHERE r.user_id = $1";
      values = [userId];
    }
    query += " ORDER BY r.booking_date DESC";
    
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error("Reservations Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/reservations", async (req, res) => {
  try {
    const { listingId, userId, moveInDate, totalRent, paymentId } = req.body;
    const query = `
      INSERT INTO reservations (listing_id, user_id, move_in_date, total_rent, payment_id, status)
      VALUES ($1, $2, $3, $4, $5, 'confirmed')
      RETURNING *
    `;
    const values = [listingId, userId, moveInDate, totalRent, paymentId];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create Reservation Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update Reservation Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. User Sync API
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/users/sync", async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    const query = `
      INSERT INTO users (uid, email, display_name, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (uid) DO UPDATE 
      SET display_name = EXCLUDED.display_name, photo_url = EXCLUDED.photo_url
      RETURNING *
    `;
    const values = [uid, email, displayName, photoURL];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("User Sync Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. Admin API
app.get("/api/admin/stats", async (req, res) => {
  try {
    const listingsCount = await pool.query("SELECT COUNT(*) FROM listings");
    const reservationsCount = await pool.query("SELECT COUNT(*) FROM reservations");
    const revenueSum = await pool.query("SELECT SUM(total_rent) FROM reservations WHERE status = 'confirmed'");
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");

    res.json({
      totalListings: parseInt(listingsCount.rows[0].count),
      totalReservations: parseInt(reservationsCount.rows[0].count),
      totalRevenue: parseFloat(revenueSum.rows[0].sum || 0),
      activeUsers: parseInt(usersCount.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: "Admin Stats Error" });
  }
});

// 5. Stripe Payment Intent
app.post("/api/create-payment-intent", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  try {
    const { amount, currency = 'eur' } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // amount in cents
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 6. AI Routes (server-side only, API key never exposed to browser)
app.get("/api/ai/listings", async (req, res) => {
  const genAI = getGenAIClient();
  if (!genAI) {
    return res.status(500).json({ error: "AI service is not configured." });
  }

  const city = (req.query.city as string || "").trim();
  if (!city) {
    return res.status(400).json({ error: "city is required" });
  }

  try {
    const model = "gemini-2.5-flash";
    const prompt = `Generate 8 high-quality rental listings for ${city}. 
Use Google Maps to find real neighborhoods and realistic pricing.
Include a mix of modern apartments and cozy rooms. 
Some should have discounts (between 10% and 30%). 
Some should be "Verified". 
Include realistic ratings (3.5 to 5.0) and review counts.
Include 2-3 amenities per listing (e.g., Wifi, Kitchen, Gym).
Prices should be realistic market rates for ${city} in appropriate currency (EUR for Europe, USD for US/International).

IMPORTANT: Return ONLY a raw JSON array of objects. Do not include markdown formatting, backticks, or explanations.
The JSON objects must have these properties:
id (string), title (string), price (number), currency (string), period (string), type (APARTMENT, ROOM, or STUDIO), provider (string), isVerified (boolean), discount (number), isNew (boolean), rating (number), reviewCount (number), amenities (array of strings), address (string).`;

    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    let textResponse = (response.text || "[]").trim();
    if (textResponse.startsWith("```json")) {
      textResponse = textResponse.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (textResponse.startsWith("```")) {
      textResponse = textResponse.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const listings = JSON.parse(textResponse);
    if (!Array.isArray(listings)) {
      return res.status(502).json({ error: "Unexpected AI response format." });
    }

    return res.json({ listings });
  } catch (error) {
    console.error("AI listings generation error:", error);
    return res.status(502).json({ error: "Failed to generate listings." });
  }
});

app.post("/api/ai/description", async (req, res) => {
  const genAI = getGenAIClient();
  if (!genAI) {
    return res.status(500).json({ error: "AI service is not configured." });
  }

  const { title, type, city, amenities } = req.body || {};
  if (!title || !type || !city || !Array.isArray(amenities)) {
    return res.status(400).json({ error: "title, type, city, and amenities are required." });
  }

  const model = "gemini-2.5-flash";
  const prompt = `Write a professional, high-converting rental listing description for a ${type} in ${city} titled "${title}".
The space includes these amenities: ${amenities.join(", ")}.
The description should be inviting, highlight the benefits of the location and features, and be about 150-200 words.
Use a tone that is sophisticated yet approachable.`;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
    });

    return res.json({ description: response.text || "No description generated." });
  } catch (error) {
    console.error("AI description generation error:", error);
    return res.status(502).json({ error: "Failed to generate description." });
  }
});

// 3. Cronjob: Cleanup expired sessions or update stats
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily cleanup cronjob...");
  // Example: Mark past reservations as completed
  try {
    await pool.query("UPDATE reservations SET status = 'completed' WHERE move_in_date < NOW() AND status = 'confirmed'");
  } catch (e) {
    console.error("Cron Error:", e);
  }
});

// --- VITE MIDDLEWARE ---
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
