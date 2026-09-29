# Memora — Production Deployment Guide

This guide covers deploying Memora to production cloud infrastructure with Supabase PostgreSQL and Hindsight Cloud.

---

## ☁️ Production Architecture

```
                    Internet
                       │
                       ▼
             [ Cloudflare / Ingress ]
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
[ Vite Frontend (Static CDN) ]   [ Express API Server (Node 22) ]
(Vercel / Cloudflare Pages)      (AWS ECS / Fly.io / Render)
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
     [ Supabase PostgreSQL ]                    [ Hindsight Cloud ]
     (Tables, Indexes, SSL)                     (Memory Bank: memora-ops)
```

---

## 1. Database Setup (Supabase PostgreSQL)

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the schema script located at:
   [`database/schema.sql`](file:///r:/Hackwithhyd/database/schema.sql)
4. (Optional) Run the seed script for initial operational history:
   [`database/seed.sql`](file:///r:/Hackwithhyd/database/seed.sql)
5. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from **Project Settings > API**.

---

## 2. Hindsight Memory Bank Setup

1. Register for [Hindsight Cloud](https://ui.hindsight.vectorize.io).
2. Apply promo code `MEMHACK99` in the billing section for $50 in free operational credits.
3. Retrieve your **API Key** from the Hindsight Cloud settings.
4. Set `HINDSIGHT_BANK_ID=memora-ops` (or create a dedicated memory bank).

---

## 3. Environment Variables

Create `.env` in production:

```ini
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Hindsight
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=vct_live_...
HINDSIGHT_BANK_ID=memora-ops

# LLM (Groq / OpenAI compatible)
LLM_API_KEY=gsk_...
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile

# App Ports & Origins
PORT=4000
WEB_URL=https://memora.yourdomain.com
NODE_ENV=production
```

---

---

## 4. Deploying to Render (Recommended - 1 Click & Free Tier)

Memora is configured as a unified full-stack application that builds both backend and frontend together, serving the React UI and Express API on a single Render URL with zero CORS configuration.

### Steps on Render:
1. Log in to [render.com](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `ALLENKISAIRAKESH/MEMORA`.
4. Configure the service settings:
   - **Name**: `memora-sre` (or any name you like)
   - **Language / Runtime**: `Node`
   - **Branch**: `main`
   - **Region**: `Oregon (US West)` or nearest
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Advanced** > **Add Environment Variable**:
   - `NODE_ENV` = `production`
   - `HINDSIGHT_API_KEY` = `your_hindsight_api_key` *(optional, falls back gracefully if not set)*
   - `HINDSIGHT_API_URL` = `https://api.hindsight.vectorize.io`
   - `HINDSIGHT_BANK_ID` = `memora-ops`
   - `LLM_API_KEY` = `your_groq_api_key` *(optional)*
   - `SUPABASE_URL` = `your_supabase_url` *(optional, uses active local store if not set)*
   - `SUPABASE_ANON_KEY` = `your_anon_key` *(optional)*
   - *(Note: Render automatically injects `PORT`)*
6. Click **Deploy Web Service**!

Render will install dependencies, build both frontend and backend, and provide you with a live HTTPS URL (e.g. `https://memora-sre.onrender.com`).

---

## 5. Alternative: Deploying via Docker on Render

If you prefer containerized deployment, select **Docker** as the runtime instead of Node on Render:
- **Runtime**: `Docker`
- **Dockerfile Path**: `./Dockerfile`
- **Docker Context**: `.`
Render will automatically build the multi-stage Docker image and start the container on port 4000/10000.
