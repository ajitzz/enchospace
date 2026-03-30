# EnchoSpace — Property Hosting & Booking Platform

EnchoSpace connects property hosts with customers (Airbnb-style workflow):

- **Hosts** publish properties from **Host your Space**.
- Property media and documents are uploaded to **AWS S3** via pre-signed upload URLs.
- Listings are served from the backend with **Redis caching** for fast UX.
- Users authenticate through **Supabase Auth** and pay via **Stripe Checkout**.

## Core architecture

- **Frontend**: React + Vite
- **Backend**: Express + PostgreSQL-compatible DB
- **Auth**: Supabase Auth (JWT verification on server)
- **Storage**: AWS S3 (assets: images/video/audio/pdf/docx/txt)
- **Cache**: Upstash Redis
- **Payments**: Stripe Checkout + webhook confirmation
- **Cold-start mitigation**: `/api/cron/keepalive` endpoint for cron-based warmups

## Environment variables

Create `.env` with:

```bash
PORT=3000
APP_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgres://...

# Supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Redis (Upstash)
UPSTASH_REDIS_URL=rediss://...

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional keepalive protection
CRON_SECRET=<secure-random-string>
```

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production notes

1. Configure a cron job (for example, Vercel Cron) to call:
   - `GET /api/cron/keepalive`
   - Include header `x-cron-secret: <CRON_SECRET>` when `CRON_SECRET` is set.
2. Configure Stripe webhook to point to:
   - `POST /api/webhook/stripe`
3. Ensure CORS / origin settings align with your deployed frontend domain.
