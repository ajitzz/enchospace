import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import path from "path";

dotenv.config();

const { Pool } = pg;

// Use the provided Neon DB connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_4cbpQjKtym9n@ep-small-smoke-a1vjxk25-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});

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
        const result = await pool.query(
          "UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *",
          [bookingId]
        );
        console.log(`Booking ${bookingId} confirmed via Stripe webhook.`);

        // Send WhatsApp confirmation message
        if (result.rows.length > 0) {
          const booking = result.rows[0];
          if (booking.user_phone) {
            const formattedPhone = booking.user_phone.replace(/\D/g, '');
            const message = `Hi ${booking.user_name},\n\nGreat news! Your payment for the ENCHO Space reservation has been successfully processed and your booking is now CONFIRMED.\n\nBooking ID: #${booking.id}\nMove-in Date: ${new Date(booking.start_date).toLocaleDateString()}\n\nWe look forward to hosting you!`;
            await sendWhatsAppMessage(formattedPhone, message);
          }
        }
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

// WhatsApp Messaging Helper
async function sendWhatsAppMessage(to: string, message: string) {
  const token = process.env.META_API_TOKEN || "EAAkr7Y9S2qYBQfHTNZASIugAzOi8b2MZCBct4z4jZBHSmQ2KGlFduuDQQGEYC9NRDtZBUdhMPdeJ06OjYUiJYGfFkZCAxzyh4TdidN7ZA10K3XPOVEiQh01jo22xLsQjXrEtMHc5ZCHZBbRZAyA5d0pl26Jsg3IuNKY272QYmqEjHghf11OKJmbUZBfJLe5EvHzl48gAZDZD";
  const phone_number_id = process.env.PHONE_NUMBER_ID || "982841698238647";

  if (!token || !phone_number_id) {
    console.warn("Missing META_API_TOKEN or PHONE_NUMBER_ID. WhatsApp message not sent.");
    return;
  }

  // Ensure message is not empty or a placeholder
  if (!message || message.trim() === "" || message.includes("Replace this sample message")) {
    console.warn("Attempted to send an empty or placeholder WhatsApp message. Aborting.");
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${phone_number_id}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Failed to send WhatsApp message:", data);
    } else {
      console.log("WhatsApp message sent successfully:", data);
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}

// WhatsApp Webhook Verification
app.get("/api/webhook/whatsapp", (req, res) => {
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN || "encho_space_token";
  
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verify_token) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// WhatsApp Webhook Message Handler
app.post("/api/webhook/whatsapp", async (req, res) => {
  const body = req.body;

  // Respond immediately to acknowledge receipt and prevent retries
  res.sendStatus(200);

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const messageObj = body.entry[0].changes[0].value.messages[0];
      const from = messageObj.from;
      const msg_body = messageObj.text?.body;

      // Only process text messages that are not empty
      if (msg_body && msg_body.trim() !== "") {
        console.log(`Received message from ${from}: ${msg_body}`);

        const lowerMsg = msg_body.toLowerCase().trim();
        let replyMessage = "";

        if (lowerMsg === "hi" || lowerMsg === "hello" || lowerMsg === "hey") {
          replyMessage = "Hello! Welcome to ENCHO Space. How can we help you today?\n\nPlease reply with:\n'1' for Booking inquiries\n'2' for Support\n'3' to speak with an agent.";
        } else if (lowerMsg === "1") {
          replyMessage = "For booking inquiries, please visit our website to explore available spaces. If you have a specific property in mind, let us know the details!";
        } else if (lowerMsg === "2") {
          replyMessage = "For support, please describe your issue in detail, and our team will get back to you shortly.";
        } else if (lowerMsg === "3") {
          replyMessage = "An agent has been notified and will be with you shortly. Thank you for your patience.";
        } else {
          replyMessage = "Thank you for reaching out to ENCHO Space. Our team will assist you shortly. Reply 'Hi' to see the main menu.";
        }

        // Ensure we never send empty or placeholder messages
        if (replyMessage && replyMessage.trim() !== "" && !replyMessage.includes("Replace this sample message")) {
          await sendWhatsAppMessage(from, replyMessage);
        }
      }
    }
  }
});

app.post("/api/bookings", async (req, res) => {
  const { property_id, user_name, user_phone, start_date, end_date, total_price } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO bookings (property_id, user_name, user_phone, start_date, end_date, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [property_id, user_name, user_phone, start_date, end_date, total_price]
    );
    
    // Send WhatsApp confirmation message
    if (user_phone) {
      const formattedPhone = user_phone.replace(/\D/g, '');
      const message = `Hi ${user_name},\n\nThank you for choosing ENCHO Space! Your reservation request has been received.\n\nMove-in Date: ${new Date(start_date).toLocaleDateString()}\nTotal Rent: $${total_price}\n\nOur team will reach out to you shortly for assistance.`;
      
      await sendWhatsAppMessage(formattedPhone, message);
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create booking" });
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
