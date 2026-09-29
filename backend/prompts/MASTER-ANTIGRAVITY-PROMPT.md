# Master Antigravity Instruction — Memora

You are the principal engineer building Memora.

Read all files in this repository before implementing features.

Source of truth:
1. PRD.md
2. docs/architecture.md
3. contracts/hindsight-memory-contract.md
4. contracts/agent-rules.md
5. database/schema.sql
6. docs/ui-spec.md
7. demo/demo-scenarios.md
8. prompts/BUILD_SEQUENCE.md

Product:
Memora — Infrastructure that remembers.

Core problem:
Production incident knowledge is fragmented and repeatedly rediscovered.

Core value:
When a similar incident happens again, Memora uses persistent Hindsight memory to reduce repeated investigation.

Core loop:
Incident → Evidence → Recall → Reason → Investigate → Resolve → Retain → Learn

Technical constraints:
- React + TypeScript + Vite
- Tailwind CSS
- Node.js + Express + TypeScript
- Supabase PostgreSQL
- Hindsight for long-term memory
- Zod validation

Critical requirement:
Hindsight must be a real working dependency in the memory loop. Do not implement fake memory retrieval behind a Hindsight-looking UI.

Engineering rules:
- production-quality structure
- typed interfaces
- validated API boundaries
- server-side secrets
- clear error handling
- test critical paths
- no fabricated metrics
- no fabricated historical memories
- no automatic destructive remediation
- current evidence takes priority over historical memory
- every historical recommendation must have an explanation

Build in phases:
1. Foundation
2. Database
3. Hindsight
4. Agent
5. Recall/investigation
6. Resolution/retain
7. UI
8. Demo
9. Hardening
10. Polish

After each phase:
- run type checking
- run tests
- run build
- fix errors
- document what changed

Do not proceed by creating placeholder implementations that look complete.

Definition of done:
A complete end-to-end demo proves that Incident A teaches Memora, Incident B benefits from that memory, and Incident C demonstrates that Memora can reject irrelevant historical guidance when current evidence differs.
