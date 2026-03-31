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

async function startServer() {
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

  // Initialize DB tables
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

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  app.get("/api/properties", async (req, res) => {
    try {
      // Try to get from Redis cache first
      let cachedProperties = null;
      let redis = null;
      
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Redis } = await import("ioredis");
        // ioredis doesn't use REST URL directly, it uses a standard redis:// or rediss:// URL
        // If the user provided a standard redis URL in UPSTASH_REDIS_URL, we use that.
        if (process.env.UPSTASH_REDIS_URL) {
           redis = new Redis(process.env.UPSTASH_REDIS_URL);
           const cached = await redis.get("properties:all");
           if (cached) {
             cachedProperties = JSON.parse(cached);
             return res.json(cachedProperties);
           }
        }
      }

      const result = await pool.query("SELECT * FROM properties ORDER BY created_at DESC");
      
      // Cache the result in Redis for 5 minutes
      if (redis) {
        await redis.set("properties:all", JSON.stringify(result.rows), "EX", 300);
      }

      res.json(result.rows);
    } catch (e) {
      console.error("Failed to fetch properties:", e);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    const { title, description, price, location, images, owner_id } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO properties (title, description, price, location, images, owner_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [title, description, price, location, JSON.stringify(images || []), owner_id || "anonymous"]
      );
      
      // Invalidate cache
      if (process.env.UPSTASH_REDIS_URL) {
        const { Redis } = await import("ioredis");
        const redis = new Redis(process.env.UPSTASH_REDIS_URL);
        await redis.del("properties:all");
      }

      res.json(result.rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { property_id, title, total_price, user_name } = req.body;
      
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
          booking_id: req.body.booking_id || null,
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

  // WhatsApp Webhook Verification
  app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === (process.env.WHATSAPP_VERIFY_TOKEN || "my_verify_token")) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });

  // In-memory chat history for Gemini
  const chatHistory: Record<string, any[]> = {};

  // WhatsApp Webhook Message Handling
  app.post("/webhook", async (req, res) => {
    const body = req.body;

    if (body.object) {
      if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
        const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from;
        const msgBody = body.entry[0].changes[0].value.messages[0].text?.body;

        if (msgBody) {
          try {
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSyDujw0ovB1bLtQJK8DKy1b__LT5aqGurz0" });
            
            if (!chatHistory[from]) {
              chatHistory[from] = [];
            }
            
            const chat = ai.chats.create({
              model: "gemini-3.1-flash-preview",
              config: {
                systemInstruction: "You are a helpful assistant for a property rental platform. You help users find properties, answer questions about bookings, and provide general support. Keep your answers concise and friendly. NEVER send placeholder messages like 'Replace this sample message'. Always provide a valid, intentional message.",
              }
            });

            // Replay history
            for (const msg of chatHistory[from]) {
               await chat.sendMessage({ message: msg.user });
               // We can't easily inject model responses into the chat history with the new SDK, 
               // so we just rely on the system instruction and the current message for now, 
               // or we can pass the history as context in the prompt.
            }

            // To properly pass history, we should just append it to the current prompt
            const historyContext = chatHistory[from].map(h => `User: ${h.user}\nAssistant: ${h.assistant}`).join("\n");
            const fullPrompt = historyContext ? `Previous conversation:\n${historyContext}\n\nUser: ${msgBody}` : msgBody;

            const response = await ai.models.generateContent({
              model: "gemini-3.1-flash-preview",
              contents: fullPrompt,
              config: {
                systemInstruction: "You are a helpful assistant for a property rental platform. You help users find properties, answer questions about bookings, and provide general support. Keep your answers concise and friendly. NEVER send placeholder messages like 'Replace this sample message'. Always provide a valid, intentional message.",
              }
            });

            const replyText = response.text || "I'm sorry, I couldn't process your request at the moment.";

            // Save to history
            chatHistory[from].push({ user: msgBody, assistant: replyText });
            if (chatHistory[from].length > 10) {
              chatHistory[from].shift(); // Keep only last 10 messages
            }

            // Send reply via WhatsApp API
            const metaToken = process.env.META_API_TOKEN || "EAAkr7Y9S2qYBQfHTNZASIugAzOi8b2MZCBct4z4jZBHSmQ2KGlFduuDQQGEYC9NRDtZBUdhMPdeJ06OjYUiJYGfFkZCAxzyh4TdidN7ZA10K3XPOVEiQh01jo22xLsQjXrEtMHc5ZCHZBbRZAyA5d0pl26Jsg3IuNKY272QYmqEjHghf11OKJmbUZBfJLe5EvHzl48gAZDZD";
            const phoneId = process.env.PHONE_NUMBER_ID || "982841698238647";
            
            if (replyText.trim() !== "") {
              const fetch = (await import("node-fetch")).default;
              await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${metaToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: from,
                  text: { body: replyText },
                }),
              });
            }
          } catch (error) {
            console.error("Error processing WhatsApp message:", error);
          }
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
