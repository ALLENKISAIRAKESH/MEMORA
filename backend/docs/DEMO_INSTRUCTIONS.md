# Memora — Live Demo Presentation Guide (For Judges & Evaluators)

This guide walks through the exact 3-minute live demonstration flow that proves Memora's core thesis: **Infrastructure that remembers**.

---

## 🎯 What This Demo Proves
1. **First Incident Teaches the Agent**: Memora investigates a database connection exhaustion incident (`INC-1001`), captures the resolution and ruled-out approaches, and retains the experience into Hindsight.
2. **Second Incident Benefits From Memory**: When a similar incident strikes (`INC-1007`), Memora recalls `INC-1001` via semantic memory, immediately prioritizes connection pool exhaustion, and **warns the operator not to restart the pods** (preventing a cold-start storm).
3. **Third Incident Rejects Memory Bias (Divergence)**: When an outage has similar symptoms but diverging telemetry (`INC-1008`, normal DB connections, 96% Redis memory), Memora recalls `INC-1001` but **explicitly rejects the old fix**, prioritizing Redis cache memory pressure instead.

---

## 🖥️ Live Step-by-Step Walkthrough

### Step 1: Start the Application
```bash
# In project root:
npm run dev
```
Open your browser to: [http://localhost:5173](http://localhost:5173)

### Step 2: The Command Dashboard (`/`)
1. Point out the top header:
   - Status indicators: `Postgres [Active]`, `Hindsight [Ready]`.
2. Review the top telemetry cards:
   - `Active Incidents`: Open production degradations.
   - `Retained Memories`: Accumulated operational experiences in the Hindsight bank.
   - `MTTR (Mean Time to Resolution)`: Baseline recovery speed.
3. Show the **Operational Loop diagram** on the right side:
   `Incident → Evidence → Hindsight Recall → Reason → Investigate → Resolve → Retain → Learn`.

---

### Step 3: Scenario 1 — First Learning Event (`INC-1001`)
1. Click on **INC-1001: Payment API latency** in the Recent Incidents list.
2. Review the 3-column layout:
   - **Left Column**: Observed evidence (`api_latency: 5.2s`, `db_connections: 99%`, `payment-api log: connection pool exhausted`).
   - **Center Column**: Investigation panel.
   - **Right Column**: Post-mortem resolution card.
3. Highlight the retained resolution:
   - **Confirmed Root Cause**: Database connection pool exhaustion.
   - **Successful Approach**: Scaled connection pool max from 50 to 100.
   - **Failed Approaches Avoided**: Restarting API pods (caused cold-start storm), increasing HTTP timeout.
   - **Generalizable Lesson**: *"When payment-api latency coincides with high DB connections, inspect pool before restart."*

---

### Step 4: Scenario 2 — Memory Changes Behavior (`INC-1007`)
1. Click **Report Incident** in the top navbar.
2. In the modal, click the **Scenario 2 (INC-1007 Recall)** quick-preset button.
3. Click **Create Incident**. The app redirects to the workspace for `INC-1007`.
4. Observe the evidence:
   - `api_latency: 4.8s`
   - `db_connections: 97%`
   - `timeouts: 31%`
5. In the center column, click **Run Investigation**.
6. **Show the Judge What Happened**:
   - The status transitions to `Investigating`.
   - **Right Column**: Memora queried Hindsight and recalled `INC-1001`.
   - **Center Column**:
     - Top Hypothesis: *Database connection pool exhaustion* (`HYPOTHESIS`, `confidence: high`).
     - Second Hypothesis: *Application container CPU saturation* (`RULED_OUT`).
     - **Action Step 2**: *"Avoid API restart (known failed approach from INC-1001 post-mortem)"*.
   - **Key Soundbite**: *"Because Memora remembered INC-1001, the on-call engineer didn't waste 20 minutes restarting pods or running CPU checks. The agent guided them directly to the pool fix."*

---

### Step 5: Scenario 3 — Preventing Memory Bias (`INC-1008`)
1. Click **Report Incident** again.
2. Click the **Scenario 3 (INC-1008 Diverge)** quick-preset button.
3. Click **Create Incident**.
4. Observe the evidence:
   - `api_latency: 4.8s` (same latency symptom!)
   - `db_connections: 34%` (normal!)
   - `redis_memory: 96%` (critical!)
5. Click **Run Investigation**.
6. **Show the Judge Why This is Revolutionary**:
   - Memora recalled `INC-1001` as a historical match, but detected **divergence**.
   - Top Hypothesis: *Redis cache memory pressure and eviction storm* (`HYPOTHESIS`).
   - Ruled-Out Hypothesis: *Database connection pool exhaustion* (`RULED_OUT` - explicitly notes that applying the old fix would be incorrect).
   - Prioritized Next Step: *Execute runbook REDIS-MEMORY-02*.
   - **Key Soundbite**: *"Stateless agents hallucinate or anchor on old fixes. Memora checks current evidence against historical assumptions, proving that live telemetry always overrides stale memory."*

---

### Step 6: The Memory Bank (`/memory`)
1. Click **Hindsight Memory** in the top navbar.
2. Inspect the operational bank for `memora-ops`.
3. Type `"payment-api"` or `"redis"` into the search box to demonstrate real-time filtering of organizational knowledge.
4. Show the post-mortem cards with both **successful fixes** and **failed attempts**.
