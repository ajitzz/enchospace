import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import path from "path";

dotenv.config();

const { Pool } = pg;

// Use the provided Neon DB connection string
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Database operations will fail.");
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const isVercelRuntime = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const isServerlessRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) || isVercelRuntime;

const app = express();
const PORT = 3000;

app.use(cors());

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
          "UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *",
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
        details JSONB,
        owner_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Add details column if it doesn't exist (for existing tables)
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS details JSONB;
      
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

// API Routes
app.use((req, res, next) => {
  if (req.url && req.url.startsWith('/api/')) {
    console.log(`[API] ${req.method} ${req.url}`);
  }
  next();
});

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
    if (!fileName || !fileType) {
      return res.status(400).json({ error: "fileName and fileType are required" });
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

app.get("/api/admin/stats", async (req, res) => {
  try {
    const propertiesCount = await pool.query("SELECT COUNT(*) FROM properties");
    const bookingsCount = await pool.query("SELECT COUNT(*) FROM bookings");
    const revenue = await pool.query("SELECT SUM(total_price) FROM bookings WHERE status = 'confirmed'");
    
    res.json({
      totalProperties: parseInt(propertiesCount.rows[0].count),
      totalBookings: parseInt(bookingsCount.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].sum || 0)
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/admin/bookings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, p.title as property_title 
      FROM bookings b 
      JOIN properties p ON b.property_id = p.id 
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    // For now, we'll list unique users from bookings as a proxy for user management
    const result = await pool.query(`
      SELECT DISTINCT ON (user_phone) user_name, user_phone, created_at 
      FROM bookings 
      ORDER BY user_phone, created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.patch("/api/admin/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Failed to update booking" });
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
  const { title, description, price, location, images, details, owner_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO properties (title, description, price, location, images, details, owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, description, price, location, JSON.stringify(images || []), JSON.stringify(details || {}), owner_id || "anonymous"]
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

app.delete("/api/properties/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM bookings WHERE property_id = $1", [id]);
    await pool.query("DELETE FROM properties WHERE id = $1", [id]);
    
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
    
    if (!process.env.STRIPE_SECRET_KEY) {
      // Mock success if no Stripe key is provided
      return res.json({ url: `/payment?success=true&property_id=${property_id}` });
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
            unit_amount: Math.round(total_price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/payment?success=true&property_id=${property_id}`,
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

// WhatsApp Messaging Helper - REMOVED

app.post("/api/bookings", async (req, res) => {
  const { property_id, user_name, user_phone, start_date, end_date, total_price } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO bookings (property_id, user_name, user_phone, start_date, end_date, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [property_id, user_name, user_phone, start_date, end_date, total_price]
    );
    
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware initialized.");
    } catch (e) {
      console.error("Failed to initialize Vite middleware:", e);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Static file serving initialized from /dist.");
  }
}

// Start Server
async function startServer() {
  await initDB();
  
  // API 404 Handler - MUST be after all API routes but BEFORE setupVite
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  await setupVite();

  if (!isServerlessRuntime) {
    if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      });
    }
  } else {
    console.log("Serverless runtime detected; Express app initialized without app.listen().");
  }
}

startServer();

export default app;
