import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import path from "path";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Refusing to start with insecure fallback credentials.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const PORT = 3000;

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true,
}));

// Stripe Webhook MUST be before express.json()
app.post("/api/webhook/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.warn("Stripe webhook secret not configured.");
    return res.status(400).send(`Webhook Error: Secret not configured`);
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2023-10-16" as any });
    
    const event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const bookingId = session.metadata?.booking_id;
      
      if (bookingId) {
        await pool.query(
          "UPDATE bookings SET status = 'confirmed' WHERE id = $1",
          [bookingId]
        );
        console.log(`Booking ${bookingId} confirmed via Stripe webhook.`);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(express.json());

function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validatePropertyPayload(body: any) {
  const errors: string[] = [];
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const location = typeof body?.location === "string" ? body.location.trim() : "";
  const price = Number(body?.price);
  const images = Array.isArray(body?.images) ? body.images.filter((url: unknown) => typeof url === "string") : [];

  if (!title || title.length < 3) errors.push("title must be at least 3 characters");
  if (!location || location.length < 2) errors.push("location is required");
  if (!Number.isFinite(price) || price <= 0) errors.push("price must be a positive number");
  if (description.length > 5000) errors.push("description too long");
  if (images.length > 30) errors.push("max 30 files allowed");

  return {
    errors,
    data: {
      title,
      description,
      location,
      price,
      images,
      owner_id: typeof body?.owner_id === "string" && body.owner_id.trim() ? body.owner_id.trim() : "anonymous",
      status: typeof body?.status === "string" ? body.status : "available",
    }
  };
}

// Initialize DB tables
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC NOT NULL,
        location VARCHAR(255) NOT NULL,
        images JSONB,
        owner_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id),
        user_name VARCHAR(255),
        user_phone VARCHAR(50),
        start_date DATE,
        end_date DATE,
        total_price NUMERIC,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database tables initialized.");
  } catch (e) {
    console.error("Failed to initialize DB tables:", e);
  }
}

initDB();

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    database: pool ? "connected" : "disconnected",
    redis: process.env.UPSTASH_REDIS_URL ? "configured" : "not configured",
    s3: process.env.AWS_S3_BUCKET_NAME ? "configured" : "not configured",
    stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "not configured"
  });
});

// Keep-alive endpoint for Vercel Cron to prevent DB from sleeping
app.get("/api/cron/keepalive", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "Database is awake" });
  } catch (e) {
    console.error("Keepalive failed:", e);
    res.status(500).json({ error: "Keepalive failed" });
  }
});

// S3 Presigned URL Generation
app.post("/api/upload-url", async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType || typeof fileName !== "string" || typeof fileType !== "string") {
      return res.status(400).json({ error: "fileName and fileType are required" });
    }
    if (fileName.length > 255) {
      return res.status(400).json({ error: "fileName too long" });
    }

    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "placeholder",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "placeholder",
      },
    });

    const key = `uploads/${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "my-property-bucket",
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME || "my-property-bucket"}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

    res.json({ uploadUrl, fileUrl });
  } catch (e) {
    console.error("Failed to generate presigned URL:", e);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

app.get("/api/properties", async (req, res) => {
  try {
    // Try to get from Redis cache first
    let cachedProperties = null;
    let redis = null;
    
    if (process.env.UPSTASH_REDIS_URL) {
      const { Redis } = await import("ioredis");
      redis = new Redis(process.env.UPSTASH_REDIS_URL);
      try {
        const cached = await redis.get("properties:all");
        if (cached) {
          cachedProperties = JSON.parse(cached);
          return res.json(cachedProperties);
        }
      } catch (redisError) {
        console.warn("Redis error:", redisError);
      }
    }

    const result = await pool.query("SELECT * FROM properties ORDER BY created_at DESC");
    
    // Cache the result in Redis for 5 minutes
    if (redis) {
      try {
        await redis.set("properties:all", JSON.stringify(result.rows), "EX", 300);
      } catch (redisError) {
        console.warn("Redis set error:", redisError);
      }
    }

    res.json(result.rows);
  } catch (e) {
    console.error("Failed to fetch properties:", e);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

app.post("/api/properties", async (req, res) => {
  const { errors, data } = validatePropertyPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Invalid property payload", details: errors });
  }

  const { title, description, price, location, images, owner_id } = data;
  try {
    const result = await pool.query(
      "INSERT INTO properties (title, description, price, location, images, owner_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, price, location, JSON.stringify(images || []), owner_id || "anonymous"]
    );
    
    // Invalidate cache
    if (process.env.UPSTASH_REDIS_URL) {
      const { Redis } = await import("ioredis");
      const redis = new Redis(process.env.UPSTASH_REDIS_URL);
      await redis.del("properties:all").catch(e => console.warn("Redis del error:", e));
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create property" });
  }
});

app.put("/api/properties/:id", async (req, res) => {
  const { id } = req.params;
  const propertyId = Number(id);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return res.status(400).json({ error: "Invalid property id" });
  }

  const { errors, data } = validatePropertyPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Invalid property payload", details: errors });
  }

  try {
    const result = await pool.query(
      "UPDATE properties SET title = $1, description = $2, price = $3, location = $4, images = $5, status = $6 WHERE id = $7 RETURNING *",
      [data.title, data.description, data.price, data.location, JSON.stringify(data.images), data.status, propertyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (process.env.UPSTASH_REDIS_URL) {
      const { Redis } = await import("ioredis");
      const redis = new Redis(process.env.UPSTASH_REDIS_URL);
      await redis.del("properties:all").catch(e => console.warn("Redis del error:", e));
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update property" });
  }
});

app.delete("/api/properties/:id", async (req, res) => {
  const { id } = req.params;
  const propertyId = Number(id);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return res.status(400).json({ error: "Invalid property id" });
  }
  try {
    await pool.query("DELETE FROM bookings WHERE property_id = $1", [propertyId]);
    await pool.query("DELETE FROM properties WHERE id = $1", [propertyId]);
    
    // Invalidate cache
    if (process.env.UPSTASH_REDIS_URL) {
      const { Redis } = await import("ioredis");
      const redis = new Redis(process.env.UPSTASH_REDIS_URL);
      await redis.del("properties:all").catch(e => console.warn("Redis del error:", e));
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

// Stripe Checkout Session
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { property_id, title, total_price, user_name, booking_id } = req.body;
    const parsedTotal = Number(total_price);
    if (!property_id || typeof title !== "string" || !Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      return res.status(400).json({ error: "Invalid checkout payload" });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      // Mock success if no Stripe key is provided
      return res.json({ url: `/payment?success=true&property_id=${property_id}&booking_id=${booking_id || ""}` });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Booking for ${title}`,
              description: `Reservation by ${user_name}`,
            },
            unit_amount: Math.round(parsedTotal * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/payment?success=true&property_id=${property_id}&booking_id=${booking_id || ""}`,
      cancel_url: `${req.headers.origin}/payment?canceled=true`,
      metadata: {
        booking_id: booking_id || null,
      }
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("Stripe error:", e);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.post("/api/bookings", async (req, res) => {
  const { property_id, user_name, user_phone, start_date, end_date, total_price } = req.body;
  if (!property_id || typeof user_name !== "string" || typeof user_phone !== "string") {
    return res.status(400).json({ error: "Invalid booking payload" });
  }
  if (!isValidIsoDate(start_date) || !isValidIsoDate(end_date)) {
    return res.status(400).json({ error: "Dates must use YYYY-MM-DD format" });
  }
  const parsedTotal = Number(total_price);
  if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
    return res.status(400).json({ error: "total_price must be a positive number" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO bookings (property_id, user_name, user_phone, start_date, end_date, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [property_id, user_name.trim(), user_phone.trim(), start_date, end_date, parsedTotal]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

app.get("/api/bookings/:id", async (req, res) => {
  const bookingId = Number(req.params.id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({ error: "Invalid booking id" });
  }
  try {
    const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [bookingId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite();

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
