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

  // WhatsApp Webhook Verification
  app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  });

  // In-memory store for WhatsApp chat history
  const chatHistory = new Map<string, any[]>();

  // WhatsApp Webhook Message Handling
  app.post("/webhook", async (req, res) => {
    try {
      const body = req.body;
      if (body.object) {
        if (
          body.entry &&
          body.entry[0].changes &&
          body.entry[0].changes[0] &&
          body.entry[0].changes[0].value.messages &&
          body.entry[0].changes[0].value.messages[0]
        ) {
          const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id || process.env.PHONE_NUMBER_ID || "982841698238647";
          const from = body.entry[0].changes[0].value.messages[0].from;
          const msgBody = body.entry[0].changes[0].value.messages[0].text?.body;

          if (msgBody) {
            // Retrieve or initialize chat history for this user
            const history = chatHistory.get(from) || [];
            
            // Add user message to history
            history.push({ role: "user", parts: [{ text: msgBody }] });

            // Keep only the last 10 messages to avoid exceeding token limits
            if (history.length > 10) {
              history.splice(0, history.length - 10);
            }

            // Use Gemini to generate a response
            const { GoogleGenAI } = await import("@google/genai");
            const geminiKey = process.env.GEMINI_API_KEY || "AIzaSyDujw0ovB1bLtQJK8DKy1b__LT5aqGurz0";
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            
            const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: history,
              config: {
                systemInstruction: "You are a helpful assistant for a property rental platform called ENCHO Space. Answer user queries about properties, bookings, and payments. NEVER output empty messages, placeholders like 'Replace this sample message', or default text. Always provide a complete, helpful, and intentional response. Remember user preferences and maintain continuity across interactions.",
                tools: [
                  {
                    functionDeclarations: [
                      {
                        name: "searchProperties",
                        description: "Search for available properties based on location or keywords.",
                        parameters: {
                          type: "OBJECT" as any,
                          properties: {
                            query: {
                              type: "STRING" as any,
                              description: "The location or keyword to search for.",
                            },
                          },
                          required: ["query"],
                        },
                      },
                    ],
                  },
                ],
              }
            });

            let replyText = response.text?.trim();
            
            // Handle function calls
            if (response.functionCalls && response.functionCalls.length > 0) {
              const call = response.functionCalls[0];
              if (call.name === "searchProperties") {
                const query = (call.args as any).query;
                try {
                  const result = await pool.query(
                    "SELECT title, price, location FROM properties WHERE title ILIKE $1 OR location ILIKE $1 LIMIT 5",
                    [`%${query}%`]
                  );
                  
                  const propertiesList = result.rows.map(r => `${r.title} in ${r.location} for $${r.price}/night`).join("\\n");
                  
                  const followUpResponse = await ai.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: [
                      ...history,
                      { role: "model", parts: [{ functionCall: call }] },
                      { role: "user", parts: [{ functionResponse: { name: call.name, response: { properties: propertiesList || "No properties found." } } }] }
                    ],
                    config: {
                      systemInstruction: "You are a helpful assistant for a property rental platform called ENCHO Space. Answer user queries about properties, bookings, and payments. NEVER output empty messages, placeholders like 'Replace this sample message', or default text. Always provide a complete, helpful, and intentional response. Remember user preferences and maintain continuity across interactions.",
                    }
                  });
                  
                  replyText = followUpResponse.text?.trim();
                } catch (e) {
                  console.error("Error executing searchProperties function:", e);
                  replyText = "I'm sorry, I encountered an error while searching for properties.";
                }
              }
            }

            if (replyText && replyText.length > 0 && !replyText.includes("Replace this sample message")) {
              // Add assistant response to history
              history.push({ role: "model", parts: [{ text: replyText }] });
              chatHistory.set(from, history);

              // Send message back via WhatsApp API
              const fetch = (await import("node-fetch")).default;
              const metaToken = process.env.META_API_TOKEN || "EAAkr7Y9S2qYBQfHTNZASIugAzOi8b2MZCBct4z4jZBHSmQ2KGlFduuDQQGEYC9NRDtZBUdhMPdeJ06OjYUiJYGfFkZCAxzyh4TdidN7ZA10K3XPOVEiQh01jo22xLsQjXrEtMHc5ZCHZBbRZAyA5d0pl26Jsg3IuNKY272QYmqEjHghf11OKJmbUZBfJLe5EvHzl48gAZDZD";
              await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
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
            } else {
               console.warn("Generated an empty or placeholder message. Skipping sending.");
            }
          }
        }
        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    } catch (e) {
      console.error("WhatsApp webhook error:", e);
      res.sendStatus(500);
    }
  });

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
