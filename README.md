# Memora — Infrastructure That Remembers

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](file:///r:/Hackwithhyd)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](file:///r:/Hackwithhyd)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF)](file:///r:/Hackwithhyd)
[![Hindsight](https://img.shields.io/badge/Memory-Hindsight-8b5cf6)](https://hindsight.vectorize.io/)

> **Memora** is a memory-powered incident response agent for DevOps/SRE teams built with [Hindsight](https://hindsight.vectorize.io/) persistent operational memory and Supabase PostgreSQL.

Production incidents frequently recur, but operational knowledge remains fragmented across post-mortems, runbooks, logs, and engineer memories. **Memora closes this loop**: when an outage occurs, it recalls relevant historical incidents, compares current evidence against past symptoms, warns against previously failed approaches, and records retained learnings upon resolution so future investigations don't start from zero.

---

## ⚡ The Operational Memory Loop

```
  Incident Ingest
       │
       ▼
Telemetry / Evidence (Metrics, Logs, Traces)
       │
       ▼
Hindsight Recall ───► Semantic retrieval of past post-mortems & runbooks
       │
       ▼
Agent Reasoning ────► Distinguishes OBSERVED, HISTORICAL, HYPOTHESIS, CONFIRMED, RULED_OUT
       │
       ▼
Prioritized Plan ───► Prevents past failed approaches (e.g. cold-start restart storms)
       │
       ▼
Post-Mortem Resolve ─► Confirmed root cause, verified fix, generalizable lessons
       │
       ▼
Hindsight Retain ───► Experience retained in memory bank for future incidents
```

---

## 🏗️ Technical Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend API**: Node.js, Express, TypeScript, Zod validation.
- **Persistent Memory**: [Hindsight](https://github.com/vectorize-io/hindsight) (`@vectorize-io/hindsight-client`).
- **Relational Store**: Supabase PostgreSQL (`@supabase/supabase-js`) with active seeded repository fallback.

### Data Ownership Rule
- **Supabase PostgreSQL** is the single source of truth for **application state** (incidents, telemetry, runbooks, steps, resolutions).
- **Hindsight** is the single source of truth for **reusable agent experience** (recalled during investigation, retained upon post-mortem resolution).

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22)
- **npm** v9+

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your credentials:
```ini
# Supabase PostgreSQL (Optional: if empty, defaults to local seeded store)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Hindsight Cloud / Self-hosted
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key
HINDSIGHT_BANK_ID=memora-ops

# LLM Provider (Groq / OpenAI compatible)
LLM_API_KEY=
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile

# App Ports
PORT=4000
WEB_URL=http://localhost:5173
```

### 3. Repository Structure
```
memora/
├── frontend/               # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/     # Navbar, Layout, Badges
│   │   ├── pages/          # Dashboard, Incidents, Workspace, Memory
│   │   ├── services/       # API client & Proxy integration
│   │   └── types/          # Frontend domain types
│   ├── vite.config.ts
│   └── package.json
├── backend/                # Node.js + Express + TypeScript API Server
│   ├── src/
│   │   ├── config/         # Environment loader with Zod validation
│   │   ├── db/             # Supabase client + seeded database store
│   │   ├── middleware/     # Error handler & Zod validation
│   │   ├── routes/         # Health, Incidents, Runbooks, Memory
│   │   ├── services/       # Hindsight client SDK & Investigation Agent
│   │   └── tests/          # Automated test suites (6/6 passing)
│   ├── tsconfig.json
│   └── package.json
├── database/               # SQL schema and seed files
├── docs/                   # Architecture, Demo guides, and visual assets
├── article.md              # Technical deep-dive article
├── docker-compose.yml      # Container orchestration
└── Dockerfile              # Multi-stage production build
```

### 4. Install Dependencies
```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 5. Run Development Servers
```bash
npm run dev
```
- **Web UI**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:4000](http://localhost:4000)
- **API Health**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

### 5. Run Automated Test Suite
```bash
npm test
```
Executes all unit and integration tests across incidents CRUD, evidence streaming, investigation step persistence, and memory-influenced agent reasoning.

---

## 🧪 Demo Scenarios

The web interface includes **1-click Quick Presets** on the *Report Incident* modal to reproduce the three core validation scenarios:

### Scenario 1 — First Learning Event (`INC-1001`)
- **Symptoms**: `payment-api` latency spikes to 5.2s, DB connection pool utilization reaches 99%.
- **Investigation**: API is not CPU saturated; requests queue waiting for DB pool allocation.
- **Resolution**: Scaled connection pool from 50 to 100.
- **Hindsight Retain**: Stores post-mortem with failed approaches (*"API restart did not help"*) and confirmed fix.

### Scenario 2 — Memory Changes Behavior (`INC-1007`)
- **Symptoms**: `payment-api` latency reaches 4.8s, DB connections reach 97%, timeouts rise to 31%.
- **Behavior**: Memora recalls `INC-1001`.
- **Reasoning**:
  - Prioritizes DB connection pool exhaustion as top hypothesis.
  - Recommends runbook `DB-CONNECTION-POOL-03`.
  - **Explicitly warns against restarting the API** because past experience proved it caused a cold-start storm without fixing the pool.

### Scenario 3 — Memory Must Not Become Bias (`INC-1008`)
- **Symptoms**: `payment-api` latency reaches 4.8s, but DB connections are normal (34%) and Redis memory is 96%.
- **Behavior**: Memora recalls `INC-1001` as a historical match, but detects **divergence**.
- **Reasoning**:
  - Notes that DB pool utilization is normal.
  - Refuses to blindly apply the old DB-pool fix.
  - Identifies Redis memory pressure and recommends runbook `REDIS-MEMORY-02`.

---

## 📡 API Surface

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System telemetry, Supabase mode, Hindsight status |
| `GET` | `/api/incidents` | List all tracked incidents |
| `POST` | `/api/incidents` | Report a new incident (Zod validated) |
| `GET` | `/api/incidents/:id` | Full incident workspace details with evidence & history |
| `POST` | `/api/incidents/:id/evidence` | Attach telemetry metric, log, or alert |
| `POST` | `/api/incidents/:id/investigate` | Trigger agent reasoning loop with Hindsight recall |
| `POST` | `/api/incidents/:id/resolve` | Post-mortem resolution + Hindsight experience retention |
| `GET` | `/api/runbooks` | List operational runbooks |
| `POST` | `/api/memory/retain` | Retain structured experience in Hindsight |
| `POST` | `/api/memory/recall` | Semantic recall of relevant operational memories |
| `GET` | `/api/memory/list` | Browse operational memory bank |

---

## 🛡️ Trust & Safety Rules
- **Observed vs Historical**: Every assertion is categorized (`OBSERVED`, `HISTORICAL`, `HYPOTHESIS`, `CONFIRMED`, `RULED_OUT`).
- **Current Evidence Priority**: If current telemetry contradicts historical memory, current telemetry wins.
- **No Destructive Remediation**: Automated actions require explicit human operator confirmation.
- **Sanitized Secrets**: Environment variables and credentials stay server-side.
