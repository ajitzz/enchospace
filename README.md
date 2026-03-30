<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Nestpick Clone

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with required secrets:
   ```bash
   GEMINI_API_KEY=your_gemini_server_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

## Production deployment (Vercel)

- Configure `GEMINI_API_KEY` as a **server-side** environment variable in Vercel.
- Do **not** expose Gemini keys in client bundles.
- Configure your Supabase/Postgres connection in Vercel (`DATABASE_URL`) since data is served through backend API routes.
- API endpoints used by the client:
  - `GET /api/ai/listings`
  - `POST /api/ai/description`
- Security headers are defined in `vercel.json`.
