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

  app.get("/api/properties", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM properties ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (e) {
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
      res.json(result.rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create property" });
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

  // WhatsApp Webhook
  app.get("/api/webhook/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === process.env.META_API_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });

  app.post("/api/webhook/whatsapp", async (req, res) => {
    const body = req.body;
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const phone_number_id = process.env.PHONE_NUMBER_ID || "982841698238647";
        const from = body.entry[0].changes[0].value.messages[0].from;
        const msg_body = body.entry[0].changes[0].value.messages[0].text.body;

        console.log("Received WhatsApp message:", msg_body, "from", from);

        // Here we could use Gemini to generate a response, but for now we just acknowledge
        // To avoid sending empty or unwanted messages, we only send a valid response
        try {
          const fetch = (await import('node-fetch')).default;
          await fetch(\`https://graph.facebook.com/v17.0/\${phone_number_id}/messages\`, {
            method: "POST",
            headers: {
              Authorization: \`Bearer \${process.env.META_API_TOKEN}\`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: from,
              text: { body: "Thank you for reaching out to our property service. How can we assist you today?" },
            }),
          });
        } catch (e) {
          console.error("Failed to send WhatsApp message", e);
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
