# Memora Product Requirements Document

## 1. Product

**Name:** Memora  
**Tagline:** Infrastructure that remembers.  
**Category:** AI-powered incident response / operational memory  
**Primary user:** DevOps / SRE engineer  
**Primary technology requirement:** Hindsight memory

## 2. Problem

Production incidents recur, but the knowledge from previous incidents is fragmented across incident records, logs, runbooks, postmortems, deployment history, and individual engineers' experience.

The operational problem is not simply lack of information. It is lack of usable historical memory at the moment of a new incident.

Engineers repeatedly rediscover:
- similar symptoms
- root causes
- investigation paths
- failed approaches
- successful fixes
- useful runbooks

Memora turns resolved incident experience into persistent operational memory.

## 3. Product thesis

Memora should make this loop real:

1. An incident occurs.
2. Memora analyzes current evidence.
3. Hindsight recalls relevant historical incident experiences.
4. The agent compares history with current evidence.
5. The agent recommends a prioritized investigation path.
6. The engineer investigates and resolves the incident.
7. Memora extracts the reusable experience.
8. Hindsight retains the experience.
9. A future similar incident benefits from the accumulated memory.

## 4. MVP promise

> When a similar production incident happens again, Memora should not start from zero.

## 5. Core user journey

### Create incident
The engineer enters:
- incident key
- title
- service
- severity
- description
- detection time
- current symptoms

### Add evidence
Evidence may include:
- metrics
- logs
- deployment information
- observations
- alerts

### Investigate
Memora:
- loads current evidence
- recalls historical experiences from Hindsight
- evaluates relevance
- separates facts, historical evidence, hypotheses, and confirmed findings
- creates a prioritized investigation plan

### Resolve
The engineer records:
- root cause
- successful resolution
- failed approaches
- runbook
- outcome

### Learn
Memora extracts a reusable incident experience and retains it in Hindsight.

### Repeat
A later incident demonstrates that the previous experience changes the investigation.

## 6. Core features

### F1 — Incident management
Create, list, view, update, resolve incidents.

### F2 — Evidence management
Attach structured evidence to an incident.

### F3 — Investigation agent
Use current evidence plus historical memory to create investigation hypotheses and next steps.

### F4 — Hindsight recall
Retrieve relevant historical incident experiences.

### F5 — Historical relevance explanation
For each recalled memory, explain:
- similarities
- differences
- why it matters
- what was successful previously
- what failed previously

### F6 — Resolution capture
Record root cause, resolution, failed approaches, runbook and lessons.

### F7 — Hindsight retain
Convert the resolved incident into reusable experience memory.

### F8 — Memory visualization
Show the historical incidents that influenced the current investigation.

### F9 — Learning-curve demo
Demonstrate:
- first incident: generic investigation
- second similar incident: historical guidance
- third different incident: agent avoids blindly applying irrelevant history

## 7. Trust and safety rules

The agent must:
- never invent a root cause
- never treat historical memory as current fact
- explicitly label hypotheses
- distinguish observed facts from historical evidence
- identify conflicting evidence
- say when memory is irrelevant
- prefer current evidence over stale historical assumptions
- never automatically execute destructive production actions in MVP
- require human confirmation for consequential actions

## 8. Memory design

Hindsight is the long-term experience layer.

Do NOT store every raw log as a memory.

Retain:
- service
- symptoms
- important evidence
- root cause
- investigation path
- ruled-out hypotheses
- failed approaches
- successful approaches
- resolution
- runbook
- outcome
- generalizable lesson

## 9. UX requirements

The main incident workspace should visibly connect:

Current incident → Historical memory → Agent reasoning → Recommended next step

Primary UI areas:
- Dashboard
- Incidents
- Incident Workspace
- Investigation
- Memory
- Post-Incident Resolution

The memory panel is a first-class product feature.

## 10. MVP non-goals

Do not build:
- automatic rollback
- automatic service restart
- Kubernetes administration
- complete log aggregation platform
- complete metrics platform
- enterprise billing
- complex multi-agent orchestration
- unsupported predictive claims

## 11. Suggested stack

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS

Backend:
- Node.js
- Express
- TypeScript

Database:
- Supabase PostgreSQL

Memory:
- Hindsight

Validation:
- Zod

Auth:
- Supabase Auth

Charts:
- Recharts

## 12. API surface

POST   /api/incidents
GET    /api/incidents
GET    /api/incidents/:id
POST   /api/incidents/:id/evidence
POST   /api/incidents/:id/investigate
GET    /api/incidents/:id/timeline
GET    /api/incidents/:id/memory
POST   /api/incidents/:id/resolve
POST   /api/memory/recall
POST   /api/memory/retain

## 13. Acceptance criteria

The MVP is complete only when:

1. A user can create an incident.
2. A user can add realistic evidence.
3. Investigation can retrieve Hindsight memories.
4. The UI shows why a historical incident is relevant.
5. The agent produces a prioritized investigation plan.
6. Investigation steps can be recorded.
7. A resolution can be recorded.
8. The resolved experience is retained in Hindsight.
9. A later similar incident retrieves the retained experience.
10. The agent's recommended investigation changes because of that memory.
11. A later dissimilar incident demonstrates that Memora does not blindly copy historical fixes.
12. No core demo path depends on hardcoded fake AI responses.
13. Errors and missing evidence are handled gracefully.
14. Environment variables are documented.
15. The project runs locally from documented setup instructions.

## 14. Demo definition of done

Demo scenario:
- Incident A: payment API latency caused by database connection pool exhaustion.
- Resolve Incident A and retain its experience.
- Incident B: similar payment API latency with high DB connection utilization.
- Memora recalls Incident A and prioritizes DB pool investigation.
- Incident C: payment API latency but normal DB connections and high Redis memory.
- Memora recalls Incident A but explains that current evidence differs and does not blindly recommend the old fix.

The final demo must visibly prove memory changes behavior.
