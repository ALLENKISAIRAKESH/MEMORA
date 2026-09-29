# Memora — Known Limitations & Future Roadmap

This document provides transparent technical disclosures regarding current MVP boundaries, safety rails, and the post-hackathon engineering roadmap.

---

## 🛑 Current MVP Non-Goals & Boundaries

1. **No Destructive Automated Remediation**:
   - Memora recommends concrete steps and runbooks, but does **not** execute automated pod restarts, database scaling mutations, or cluster failovers.
   - *Rationale*: Operational safety rule #1. Consequential production changes must require human confirmation.

2. **Telemetry Ingestion vs. Observability Replacement**:
   - Memora is an operational memory and investigation agent, not a metrics scraper or log aggregation platform (Datadog, Prometheus, Grafana).
   - In production, Memora ingests structured telemetry via webhooks or OpenTelemetry collectors.

3. **Single Active Memory Bank Per Team (`memora-ops`)**:
   - Currently, memories are scoped to a shared operational bank. Multi-tenant workspace partitioning across distinct engineering organizations is planned for v1.1.

4. **Transient Network Handling**:
   - When the external Hindsight Cloud endpoint or LLM API is temporarily unreachable or unconfigured, Memora enters a documented **degraded-memory state**. It continues investigation using live PostgreSQL telemetry and flags historical memory as degraded rather than failing silently.

---

## 🛡️ Trust & Safety Engineering

1. **Anti-Hallucination & Grounding**:
   - The agent strictly enforces evidence classifications (`OBSERVED`, `HISTORICAL`, `HYPOTHESIS`, `CONFIRMED`, `RULED_OUT`).
   - The agent never invents telemetry numbers or phantom incidents.
2. **Current Evidence Precedence**:
   - When historical experience conflicts with current metrics, current telemetry always wins.
3. **Secrets Isolation**:
   - API keys and tokens remain strictly server-side.
   - Raw logs containing credentials or auth headers are sanitized before retention to long-term memory.

---

## 🗺️ Engineering Roadmap (Post-MVP)

- **v1.1**: OpenTelemetry collector integration (native OTLP ingestion for Prometheus & Jaeger).
- **v1.2**: Slack & PagerDuty bi-directional incident channel bot (`/memora investigate`).
- **v1.3**: Automated runbook step verification via read-only Kubernetes and AWS/GCP API probes with human approval gating.
- **v1.4**: Cross-service dependency graph memory (retaining cascading failure paths across microservices).
