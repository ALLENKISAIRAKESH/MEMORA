# Antigravity Build Sequence

Use these prompts in order. Do not ask Antigravity to build everything in one shot.

## Prompt 1 — Foundation

Read `PRD.md`, `docs/architecture.md`, `database/schema.sql`, and `docs/ui-spec.md`.

Create the Memora repository using:
- React + TypeScript + Vite
- Tailwind CSS
- Node.js + Express + TypeScript
- Supabase PostgreSQL

Implement:
- project structure
- environment configuration
- database client
- API server
- frontend shell
- basic routing
- health endpoint
- error handling
- validation with Zod

Do not implement fake AI behavior.

Run the project and verify frontend + backend startup.

## Prompt 2 — Database

Implement the schema in `database/schema.sql`.

Seed the synthetic data in `database/seed.sql`.

Build CRUD APIs for:
- incidents
- evidence
- investigations
- investigation steps
- runbooks
- resolutions

Add tests for the core API operations.

## Prompt 3 — Hindsight

Read `contracts/hindsight-memory-contract.md`.

Integrate the real Hindsight service/API.

Create:
- hindsight.service
- retain experience
- recall experience
- error handling
- normalized memory result types

Do not replace Hindsight with local mock storage.

If Hindsight credentials/configuration are missing, stop only at the integration boundary and provide a clear environment setup error; do not fake successful memory operations.

## Prompt 4 — Agent

Read `contracts/agent-rules.md`.

Implement the incident investigation agent.

Tools:
- get_incident
- get_evidence
- recall_memory
- get_runbook
- record_investigation_step
- record_resolution

The agent must distinguish OBSERVED, HISTORICAL, HYPOTHESIS, CONFIRMED and RULED_OUT.

Implement structured outputs and validation.

## Prompt 5 — Recall → Investigation

Connect:
new incident
→ current evidence
→ Hindsight recall
→ relevance analysis
→ hypotheses
→ prioritized investigation steps

Persist investigation state.

Expose:
POST /api/incidents/:id/investigate

No hardcoded incident-specific answer logic.

## Prompt 6 — Resolution → Retain

Connect:
resolved incident
→ extract experience
→ validate experience
→ Hindsight retain

Store application-level resolution data in Supabase.

Store reusable agent experience in Hindsight.

## Prompt 7 — UI

Read `docs/ui-spec.md`.

Build:
- dashboard
- incidents table
- incident workspace
- investigation panel
- Hindsight memory panel
- resolution form
- memory browser

The incident workspace must clearly show when a recommendation was influenced by historical memory.

## Prompt 8 — Demo

Implement the scenarios in `demo/demo-scenarios.md`.

Make the demo reproducible with seeded data.

The UI must visibly demonstrate:
1. first incident teaches Memora
2. second incident benefits from memory
3. third incident differs and prevents blind reuse

## Prompt 9 — Hardening

Test:
- no memory
- irrelevant memory
- conflicting memory
- incomplete evidence
- duplicate incidents
- Hindsight unavailable
- malformed LLM output
- invalid API requests
- unauthorized mutation
- secrets accidentally appearing in memory

Do not hide errors.

## Prompt 10 — Final polish

Verify:
- README setup
- `.env.example`
- migrations
- seed data
- tests
- lint
- type checking
- production build

Then produce:
- architecture diagram
- demo instructions
- known limitations
- deployment instructions
- final screenshots checklist
