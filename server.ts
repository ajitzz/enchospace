import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import path from "path";
import { validateEnv, isProduction } from "./src/lib/env";
import { logger } from "./src/lib/logger";
import { propertySchema, bookingSchema, bookingStatusSchema, paymentSchema } from "./src/lib/validation";
import { z } from "zod";

dotenv.config();

// Validate environment variables at startup
const env = validateEnv();

const { Pool } = pg;

// Database Pool with production hardening
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isProduction() ? { rejectUnauthorized: false } : false,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Robust query wrapper with error handling and logging
async function dbQuery(text: string, params?: unknown[]) {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (!isProduction()) {
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code;
    logger.error('Database Query Error:', {
      text,
      error: errorMessage,
      code: errorCode
    });
    throw error;
  }
}

const isVercelRuntime = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const isServerlessRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) || isVercelRuntime;

const app = express();
const PORT = 3000;

// Explicit CORS whitelist
app.use(cors({
  origin: (origin, callback) => {
    const whitelist = env.FRONTEND_URLS.split(',');
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 3600,
}));

// Validation Middleware
const validateRequest = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation Error:', error.issues);
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues,
        timestamp: new Date().toISOString()
      });
    } else {
      next(error);
    }
  }
};

// Stripe Webhook MUST be before express.json()
app.post("/api/webhook/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    logger.warn("Stripe webhook signature or secret missing.");
    return res.status(400).send(`Webhook Error: Missing signature or secret`);
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
    
    const event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    logger.info(`Stripe Webhook Received: ${event.type}`, { id: event.id });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: { booking_id?: string } };
      const bookingId = session.metadata?.booking_id;
      
      if (bookingId) {
        await dbQuery(
          "UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *",
          [parseInt(bookingId)]
        );
        logger.info(`Booking ${bookingId} confirmed via Stripe webhook.`);
      }
    }

    res.json({ received: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Stripe Webhook Error: ${errorMessage}`);
    res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
});

app.use(express.json());

// Initialize DB tables
async function initDB() {
  try {
    // Test connection
    const client = await pool.connect();
    client.release();
    logger.info("Database connection successful.");

    await dbQuery(`
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
    logger.info("Database tables initialized.");
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("Failed to initialize DB tables:", { error: errorMessage });
  }
}

// API Routes
app.use((req, res, next) => {
  if (req.url && req.url.startsWith('/api/')) {
    logger.info(`[API Request] ${req.method} ${req.url}`);
  }
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    database: pool ? "connected" : "disconnected",
    redis: env.UPSTASH_REDIS_URL ? "configured" : "not configured",
    s3: env.AWS_S3_BUCKET_NAME ? "configured" : "not configured",
    stripe: env.STRIPE_SECRET_KEY ? "configured" : "not configured",
    timestamp: new Date().toISOString()
  });
});

// Keep-alive endpoint for Vercel Cron to prevent DB from sleeping
app.get("/api/cron/keepalive", async (req, res) => {
  try {
    await dbQuery("SELECT 1");
    res.json({ status: "Database is awake", timestamp: new Date().toISOString() });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("Keepalive failed:", { error: errorMessage });
    res.status(500).json({ error: "Keepalive failed", timestamp: new Date().toISOString() });
  }
});

// S3 Presigned URL Generation
app.post("/api/upload-url", async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({ error: "fileName and fileType are required" });
    }

    // Security: Validate file type and size
    const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg', 'application/pdf'];
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      logger.warn("Unauthorized file type attempt:", { fileType });
      return res.status(400).json({ error: "File type not allowed" });
    }

    if (fileSize && fileSize > 10 * 1024 * 1024) { // 10MB limit
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const key = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl, fileUrl });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("Failed to generate presigned URL:", { error: errorMessage });
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

app.get("/api/admin/stats", async (req, res) => {
  try {
    const [propertiesCount, bookingsCount, revenue] = await Promise.all([
      dbQuery("SELECT COUNT(*) FROM properties"),
      dbQuery("SELECT COUNT(*) FROM bookings"),
      dbQuery("SELECT SUM(total_price) FROM bookings WHERE status = 'confirmed'")
    ]);
    
    res.json({
      totalProperties: parseInt(propertiesCount.rows[0]?.count || "0"),
      totalBookings: parseInt(bookingsCount.rows[0]?.count || "0"),
      totalRevenue: parseFloat(revenue.rows[0]?.sum || "0"),
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error fetching stats:", { error: errorMessage });
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/admin/bookings", async (req, res) => {
  try {
    const result = await dbQuery(`
      SELECT b.*, p.title as property_title 
      FROM bookings b 
      JOIN properties p ON b.property_id = p.id 
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error fetching bookings:", { error: errorMessage });
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await dbQuery(`
      SELECT DISTINCT ON (user_phone) user_name, user_phone, created_at 
      FROM bookings 
      ORDER BY user_phone, created_at DESC
    `);
    res.json(result.rows);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error fetching users:", { error: errorMessage });
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.patch("/api/admin/bookings/:id", validateRequest(z.object({ status: bookingStatusSchema })), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await dbQuery(
      "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(result.rows[0]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error updating booking:", { error: errorMessage });
    res.status(500).json({ error: "Failed to update booking" });
  }
});

app.get("/api/properties", async (req, res) => {
  try {
    // Try to get from Redis cache first
    let redis = null;
    
    if (env.UPSTASH_REDIS_URL) {
      try {
        const { Redis } = await import("ioredis");
        redis = new Redis(env.UPSTASH_REDIS_URL);
        const cached = await redis.get("properties:all");
        if (cached) {
          logger.info("Serving properties from cache");
          return res.json(JSON.parse(cached));
        }
      } catch (redisError: unknown) {
        const errorMessage = redisError instanceof Error ? redisError.message : String(redisError);
        logger.warn("Redis error (serving from DB):", { error: errorMessage });
      }
    }

    const result = await dbQuery("SELECT * FROM properties ORDER BY created_at DESC");
    
    // Cache the result in Redis for 5 minutes (atomic SET EX)
    if (redis) {
      try {
        await redis.set("properties:all", JSON.stringify(result.rows), "EX", 300);
      } catch (redisError: unknown) {
        const errorMessage = redisError instanceof Error ? redisError.message : String(redisError);
        logger.warn("Redis set error:", { error: errorMessage });
      }
    }

    res.json(result.rows);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("Failed to fetch properties:", { error: errorMessage });
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

app.post("/api/properties", validateRequest(propertySchema), async (req, res) => {
  const { title, description, price, location, images, details, owner_id } = req.body;
  try {
    const result = await dbQuery(
      "INSERT INTO properties (title, description, price, location, images, details, owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, description, price, location, JSON.stringify(images || []), JSON.stringify(details || {}), owner_id]
    );
    
    // Invalidate cache
    if (env.UPSTASH_REDIS_URL) {
      try {
        const { Redis } = await import("ioredis");
        const redis = new Redis(env.UPSTASH_REDIS_URL);
        await redis.del("properties:all");
      } catch (redisError: unknown) {
        const errorMessage = redisError instanceof Error ? redisError.message : String(redisError);
        logger.warn("Redis cache invalidation failed:", { error: errorMessage });
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("Failed to create property:", { error: errorMessage });
    res.status(500).json({ error: "Failed to create property" });
  }
});

app.delete("/api/properties/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Promise.all([
      dbQuery("DELETE FROM bookings WHERE property_id = $1", [id]),
      dbQuery("DELETE FROM properties WHERE id = $1", [id])
    ]);
    
    // Invalidate cache
    if (env.UPSTASH_REDIS_URL) {
      try {
        const { Redis } = await import("ioredis");
        const redis = new Redis(env.UPSTASH_REDIS_URL);
        await redis.del("properties:all");
      } catch (redisError: unknown) {
        const errorMessage = redisError instanceof Error ? redisError.message : String(redisError);
        logger.warn("Redis del error:", { error: errorMessage });
      }
    }

    res.json({ success: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("Failed to delete property:", { error: errorMessage });
    res.status(500).json({ error: "Failed to delete property" });
  }
});

// Stripe Checkout Session
app.post("/api/create-checkout-session", validateRequest(paymentSchema), async (req, res) => {
  try {
    const { property_id, title, total_price, user_name, booking_id } = req.body;
    
    if (!env.STRIPE_SECRET_KEY) {
      logger.warn("Stripe secret key not configured, using mock payment.");
      return res.json({ url: `/payment?success=true&property_id=${property_id}` });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });

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
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("Stripe error:", { error: errorMessage });
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.post("/api/bookings", validateRequest(bookingSchema), async (req, res) => {
  const { property_id, user_name, user_phone, start_date, end_date, total_price } = req.body;
  try {
    const result = await dbQuery(
      "INSERT INTO bookings (property_id, user_name, user_phone, start_date, end_date, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [property_id, user_name, user_phone, start_date, end_date, total_price]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("Failed to create booking:", { error: errorMessage });
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

// Global Error Handler
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;
  const errorStatus = (err as any)?.status || 500;

  logger.error('Unhandled Error:', { 
    message: errorMessage, 
    stack: isProduction() ? undefined : errorStack,
    path: req.path,
    method: req.method
  });

  res.status(errorStatus).json({
    error: isProduction() ? 'Internal Server Error' : errorMessage,
    timestamp: new Date().toISOString()
  });
});

// Start Server
async function startServer() {
  await initDB();
  
  // API 404 Handler - MUST be after all API routes but BEFORE setupVite
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}`, timestamp: new Date().toISOString() });
  });

  await setupVite();

  if (!isServerlessRuntime) {
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on http://localhost:${PORT} in ${env.NODE_ENV} mode`);
    });
  } else {
    logger.info("Serverless runtime detected; Express app initialized without app.listen().");
  }
}

startServer();

export default app;
