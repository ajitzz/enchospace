import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import Redis from "ioredis";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Stripe from "stripe";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const redis = process.env.UPSTASH_REDIS_URL
  ? new Redis(process.env.UPSTASH_REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      tls: process.env.UPSTASH_REDIS_URL.startsWith("rediss://") ? {} : undefined,
    })
  : null;
let redisConnected = false;

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
const KEEPALIVE_CRON_SECRET = process.env.CRON_SECRET;

const allowedAssetMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

type AuthedRequest = express.Request & { userId?: string; userEmail?: string };

const requireAuth = async (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Supabase auth is not configured on server" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email || undefined;

    next();
  } catch (error) {
    console.error("Auth middleware failed:", error);
    return res.status(500).json({ error: "Authentication failure" });
  }
};

const toListing = (row: any) => ({
  ...row,
  assets: Array.isArray(row.assets) ? row.assets : [],
  details: typeof row.details === "object" && row.details ? row.details : {},
});

async function bootstrapDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id BIGSERIAL PRIMARY KEY,
      owner_id UUID,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC NOT NULL,
      location VARCHAR(255) NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      assets JSONB DEFAULT '[]'::jsonb,
      status VARCHAR(50) DEFAULT 'available',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id BIGSERIAL PRIMARY KEY,
      property_id BIGINT REFERENCES properties(id) ON DELETE CASCADE,
      user_id UUID,
      user_name VARCHAR(255),
      user_phone VARCHAR(50),
      start_date DATE,
      end_date DATE,
      total_price NUMERIC,
      stripe_session_id TEXT,
      payment_status VARCHAR(50) DEFAULT 'pending',
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    if (!redisConnected) {
      await redis.connect();
      redisConnected = true;
    }
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Redis get failed:", error);
    return null;
  }
}

async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  if (!redis) return;
  try {
    if (!redisConnected) {
      await redis.connect();
      redisConnected = true;
    }
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.warn("Redis set failed:", error);
  }
}

async function cacheDelete(key: string) {
  if (!redis) return;
  try {
    if (!redisConnected) {
      await redis.connect();
      redisConnected = true;
    }
    await redis.del(key);
  } catch (error) {
    console.warn("Redis delete failed:", error);
  }
}

async function cacheDeleteByPrefix(prefix: string) {
  if (!redis) return;
  try {
    if (!redisConnected) {
      await redis.connect();
      redisConnected = true;
    }
    const stream = redis.scanStream({ match: `${prefix}*`, count: 200 });
    stream.on("data", async (keys: string[]) => {
      if (keys.length) {
        await redis.del(...keys);
      }
    });
    await new Promise((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });
  } catch (error) {
    console.warn("Redis prefix delete failed:", error);
  }
}

const mapProperty = (row: any) => ({
  id: row.id,
  owner_id: row.owner_id,
  title: row.title,
  description: row.description,
  price: Number(row.price),
  location: row.location,
  details: typeof row.details === "object" && row.details ? row.details : {},
  assets: Array.isArray(row.assets) ? row.assets : [],
  status: row.status || "available",
  created_at: row.created_at,
});

async function persistPropertyManifestToS3(property: any) {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) return null;

  try {
    const key = `properties/${property.owner_id || "public"}/manifests/property-${property.id}.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(property, null, 2),
        ContentType: "application/json",
      }),
    );

    return {
      key,
      url: `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
    };
  } catch (error) {
    console.warn("Property manifest upload failed:", error);
    return null;
  }
}

async function readProperties(city?: string) {
  const params: any[] = [];
  let sql = "SELECT * FROM properties";

  if (city) {
    params.push(`%${city}%`);
    sql += ` WHERE location ILIKE $${params.length}`;
  }

  sql += " ORDER BY created_at DESC LIMIT 200";

  try {
    const result = await pool.query(sql, params);
    return result.rows.map(toListing);
  } catch (error) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw error;

    const query = supabaseAdmin.from("properties").select("*").order("created_at", { ascending: false }).limit(200);
    const { data, error: supabaseError } = city
      ? await query.ilike("location", `%${city}%`)
      : await query;
    if (supabaseError) throw error;
    return (data || []).map(mapProperty).map(toListing);
  }
}

async function startServer() {
  await bootstrapDatabase();

  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(cors());

  app.post("/api/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(500).send("Stripe is not configured");
      }

      const signature = req.headers["stripe-signature"];
      if (!signature || typeof signature !== "string") {
        return res.status(400).send("Missing stripe signature");
      }

      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;

        if (bookingId) {
          await pool.query(
            `UPDATE bookings
             SET status = 'confirmed', payment_status = 'paid', stripe_session_id = $1
             WHERE id = $2`,
            [session.id, bookingId],
          );
        }
      }

      return res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/config/public", (_req, res) => {
    res.json({
      stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
      authEnabled: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      uploadsEnabled: Boolean(process.env.AWS_S3_BUCKET_NAME),
    });
  });

  app.get("/api/cron/keepalive", async (req, res) => {
    try {
      if (KEEPALIVE_CRON_SECRET) {
        const token = req.headers["x-cron-secret"];
        if (token !== KEEPALIVE_CRON_SECRET) {
          return res.status(401).json({ error: "Unauthorized keepalive call" });
        }
      }

      await pool.query("SELECT 1");
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabaseAdmin.from("properties").select("id").limit(1);
      }
      if (redis) {
        if (!redisConnected) {
          await redis.connect();
          redisConnected = true;
        }
        await redis.ping();
      }
      res.json({ status: "awake" });
    } catch (error) {
      console.error("Keepalive failed:", error);
      res.status(500).json({ error: "Keepalive failed" });
    }
  });

  app.get("/api/properties", async (req, res) => {
    try {
      const city = (req.query.city as string | undefined)?.trim();
      const cacheKey = city ? `properties:city:${city.toLowerCase()}` : "properties:all";

      const cached = await cacheGet<any[]>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const rows = await readProperties(city);
      await cacheSet(cacheKey, rows, 300);

      return res.json(rows);
    } catch (error) {
      console.error("Get properties failed:", error);
      return res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.post("/api/upload-url", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { fileName, fileType, fileSize } = req.body as {
        fileName?: string;
        fileType?: string;
        fileSize?: number;
      };

      if (!fileName || !fileType) {
        return res.status(400).json({ error: "fileName and fileType are required" });
      }

      if (!allowedAssetMimeTypes.has(fileType)) {
        return res.status(400).json({ error: `Unsupported file type: ${fileType}` });
      }
      if (typeof fileSize === "number" && fileSize > 25 * 1024 * 1024) {
        return res.status(400).json({ error: "Maximum file size is 25MB per asset" });
      }

      const bucket = process.env.AWS_S3_BUCKET_NAME;
      if (!bucket) {
        return res.status(500).json({ error: "AWS_S3_BUCKET_NAME is not configured" });
      }

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `properties/${req.userId}/${Date.now()}-${safeName}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });
      const fileUrl = `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

      return res.json({ uploadUrl, fileUrl, key });
    } catch (error) {
      console.error("Presigned URL generation failed:", error);
      return res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/properties", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { title, description, price, location, assets, details } = req.body;

      if (!title || !price || !location) {
        return res.status(400).json({ error: "title, price, and location are required" });
      }
      if (!Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ error: "At least one uploaded media/document asset is required" });
      }

      const inserted = await pool.query(
        `INSERT INTO properties (owner_id, title, description, price, location, assets, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.userId,
          title,
          description || null,
          Number(price),
          location,
          JSON.stringify(Array.isArray(assets) ? assets : []),
          JSON.stringify(typeof details === "object" && details ? details : {}),
        ],
      );

      const property = toListing(inserted.rows[0]);
      const manifest = await persistPropertyManifestToS3(property);

      if (manifest) {
        await pool.query(
          `UPDATE properties
           SET details = jsonb_set(details, '{manifest}', $1::jsonb, true)
           WHERE id = $2`,
          [JSON.stringify(manifest), property.id],
        );
        property.details = {
          ...(property.details || {}),
          manifest,
        };
      }

      await cacheDelete("properties:all");
      await cacheDeleteByPrefix("properties:city:");

      return res.status(201).json(property);
    } catch (error) {
      console.error("Create property failed:", error);
      return res.status(500).json({ error: "Failed to create property" });
    }
  });

  app.post("/api/bookings", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { property_id, user_name, user_phone, start_date, end_date, total_price } = req.body;

      const result = await pool.query(
        `INSERT INTO bookings (property_id, user_id, user_name, user_phone, start_date, end_date, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [property_id, req.userId, user_name, user_phone, start_date, end_date, total_price],
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Create booking failed:", error);
      return res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.post("/api/create-checkout-session", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { property_id, title, total_price, booking_id } = req.body;

      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      const origin = req.headers.origin || APP_BASE_URL;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: req.userEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: Math.round(Number(total_price) * 100),
              product_data: {
                name: `Reservation: ${title}`,
                description: `Property ID ${property_id}`,
              },
            },
          },
        ],
        success_url: `${origin}/payment?success=true&property_id=${property_id}`,
        cancel_url: `${origin}/payment?canceled=true`,
        metadata: {
          booking_id: String(booking_id || ""),
          property_id: String(property_id || ""),
          user_id: String(req.userId || ""),
        },
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe checkout session failed:", error);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
