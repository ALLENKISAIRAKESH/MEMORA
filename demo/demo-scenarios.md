# Memora Demo Scenarios

## Scenario 1 — First learning event

Create:
INC-1001
Payment API latency
- API latency 5.2s
- DB connections 99%
- timeouts increasing

Investigation:
- CPU normal
- network normal
- DB pool exhausted

Resolution:
Increase pool from 50 to 100.

Retain the experience.

## Scenario 2 — Memory changes behavior

Create:
INC-1007
Payment API latency
- API latency 4.8s
- DB connections 97%
- timeouts 31%

Expected:
Memora recalls INC-1001 and prioritizes DB connection pool investigation.

It should explain:
- same service
- similar symptom
- similar DB evidence
- previous successful fix

## Scenario 3 — Memory must not become bias

Create:
INC-1008
Payment API latency
- API latency 4.8s
- DB connections normal
- Redis memory 96%

Expected:
Memora recalls INC-1001 as a historical match but explicitly notes that current evidence differs.

It should prioritize Redis investigation instead of blindly recommending the old DB-pool fix.

## Scenario 4 — No useful memory

Create an unrelated service incident.

Expected:
"No relevant historical memory found."

The agent should investigate from current evidence.
