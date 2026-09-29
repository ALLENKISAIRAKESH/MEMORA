# Memora — Social Post & Video Deliverables

## 1. LinkedIn Post (Andrej Karpathy Style)

```
Most AI agents today are stateless amnesiacs. You give them a prompt, they do some work, and then they completely forget everything they learned.

In production engineering, this is catastrophic. 

When an API latencies spike at 3 AM, engineers shouldn't rediscover the same connection pool exhaustion or repeat the same failed pod restarts that crashed the cluster last month.

We built Memora: an SRE incident response agent powered by Hindsight persistent memory.

Here is the before / after:
• Without memory: Agent treats recurring latency as a novel mystery, checks random metrics, and suggests restarting pods (triggering a cold-start storm).
• With Hindsight memory: Agent instantly recalls INC-1001, warns against restarting pods (known failed approach), prioritizes DB pool runbooks, and explains exactly why the memory applies.
• When metrics diverge (e.g. Redis memory instead of DB): The agent rejects the historical bias and pivots to cache analysis.

Check out the full technical writeup: [Article Link]
Github repo: https://github.com/your-username/memora

#AIAgents #AgentMemory #Hindsight #AIMemory #LLM
```

*Comment to add under post:*
```
Here's a link to Hindsight if you want to check it out: https://github.com/vectorize-io/hindsight
```

---

## 2. 3-Minute Video Demo Script

### Video Metadata
**Proposed High-Performing Titles:**
1. I Built an AI SRE Agent That Remembers Past Outages (Using Hindsight)
2. Why Your AI Coding Agent Needs Persistent Memory: Building Memora
3. From 3 AM Outages to Instant Fixes: AI Agent Memory in Action
4. We Stopped Rediscovering the Same Outages with Hindsight Memory
5. Inside Memora: An Incident Response Agent That Actually Learns

**YouTube Thumbnail Prompt (Nano Banana / Generative AI, 16:9):**
> A split-screen futuristic dark-mode terminal concept. On the left, glowing red alarm monitors and frantic error graphs labeled "WITHOUT MEMORY: STARTING FROM ZERO". On the right, clean glowing purple and emerald telemetry cards labeled "WITH HINDSIGHT: INFRASTRUCTURE THAT REMEMBERS" showing recalled post-mortem nodes connecting to an incident dashboard. Modern cyber-minimalist SRE aesthetic, 4K, high contrast.

---

### Step-by-Step Script with Screen Cues

#### [0:00 - 0:30] Quick Intro
- **Visual Cue**: Show camera / talking head or direct full-screen capture of Memora Dashboard at `http://localhost:5173`.
- **Narration**:
  > "Hi everyone, I'm [Your Name]. If you've ever been on call for a production backend, you know the pain of rediscovering the same outage twice. Incidents recur, but the operational knowledge from past post-mortems is locked away in closed tickets or Google Docs.
  > Today, we're looking at **Memora** — an incident response agent built around the thesis that infrastructure should remember. Using Hindsight for persistent operational memory, Memora ensures your team never starts an investigation from scratch."

#### [0:30 - 1:00] The Problem: The Stateless Trap
- **Visual Cue**: Navigate to the Incident Directory (`/incidents`), click on an active incident. Show raw metrics without memory context.
- **Narration**:
  > "When a stateless agent sees API latency spike to 5 seconds, it has zero context. It suggests generic troubleshooting: check CPU, restart pods, or increase HTTP timeouts. 
  > But what if restarting the pods causes a cold-start storm that makes latency 10 times worse? Without persistent memory, agents repeat the exact same mistakes that human engineers previously made."

#### [1:00 - 2:30] Live Demo: Retain, Recall & Behavioral Change
- **Visual Cue**: 
  1. Click **Scenario 1 (`INC-1001`)**: Show the initial incident resolved with pool scaling, and click **Resolve & Retain** to demonstrate the experience being committed to the Hindsight memory bank.
  2. Click **Scenario 2 (`INC-1007`)**: Open the workspace and click **Run Investigation**.
  3. Zoom in on the center and right columns.
- **Narration**:
  > "Now look what happens when a similar incident occurs weeks later in Scenario 2. The moment we click 'Run Investigation', Memora queries the Hindsight memory bank. 
  > Look at the right column: it recalled INC-1001. In the center column, the agent immediately prioritizes database connection pool exhaustion. Crucially, look at Step 2: it explicitly warns us: *'Avoid API restart: known failed approach from INC-1001'*. That single piece of recalled intelligence just saved 20 minutes of downtime."
- **Visual Cue**: 
  4. Open **Scenario 3 (`INC-1008`)** and run investigation. Show how the agent detects that Redis is high and DB connections are normal.
- **Narration**:
  > "Even better: Memora doesn't suffer from memory bias. In Scenario 3, latency is high again, but current telemetry shows DB connections are normal and Redis memory is 96%. Instead of blindly copying the old fix, Memora detects the divergence, rules out the DB pool fix, and prioritizes our Redis runbook."

#### [2:30 - 3:00] Wrap-up & Key Takeaway
- **Visual Cue**: Switch to the **Hindsight Memory Bank (`/memory`)** page showing all accumulated incident experiences.
- **Narration**:
  > "The biggest takeaway from building Memora: AI agents become exponentially more valuable when they remember not just what succeeded, but what failed. By combining real-time PostgreSQL telemetry with Hindsight's semantic memory bank, we've created operational memory that gets smarter with every incident.
  > Check out the GitHub repo and article below. Thanks for watching!"
