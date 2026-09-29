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

## 4. Production Build & Execution

### Build from source:
```bash
npm install
npm run build
```

### Start API in production:
```bash
cd server
NODE_ENV=production node dist/index.js
```

### Serve Frontend static bundle:
Deploy `client/dist` to any static hosting provider (Vercel, Cloudflare Pages, AWS S3 + CloudFront).

---

## 5. Docker Deployment

A production `Dockerfile` and `docker-compose.yml` are provided in the repository root:

```bash
# Build and run the entire stack
docker compose up -d --build
```
Memora will be accessible at:
- Web: `http://localhost:5173`
- API: `http://localhost:4000`
