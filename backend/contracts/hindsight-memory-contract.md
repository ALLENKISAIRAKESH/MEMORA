# Hindsight Memory Contract

## Purpose

Define exactly what Memora retains and recalls.

## Retain object

```json
{
  "type": "incident_experience",
  "service": "payment-api",
  "symptoms": [
    "high API latency",
    "request timeouts",
    "high DB connection utilization"
  ],
  "important_evidence": [
    "DB connection utilization reached 99%"
  ],
  "root_cause": "Database connection pool exhaustion",
  "investigation_path": [
    "Checked CPU and ruled out saturation",
    "Checked network and ruled out network latency",
    "Inspected DB pool and confirmed exhaustion"
  ],
  "failed_approaches": [
    "Restart API",
    "Increase request timeout"
  ],
  "successful_approaches": [
    "Increase DB connection pool"
  ],
  "runbook": "DB-CONNECTION-POOL-03",
  "outcome": "Latency returned to normal",
  "lesson": "When similar symptoms occur with high DB connection utilization, inspect the pool first."
}
```

## Retain rules

1. Retain only after resolution or an explicit learning event.
2. Never fabricate missing root cause.
3. Never retain secrets from logs.
4. Prefer concise reusable experience over raw log dumps.
5. Include failed approaches because they prevent repeated waste.
6. Include the evidence supporting the root cause.
7. Preserve uncertainty when the incident was not conclusively resolved.

## Recall input

```json
{
  "service": "payment-api",
  "symptoms": [
    "high latency",
    "timeouts"
  ],
  "current_evidence": [
    "DB connections 97%"
  ],
  "recent_changes": [
    "payment-api v2.4.1"
  ]
}
```

## Recall output

Each result must provide:
- memory/incident identifier
- relevance
- similarities
- differences
- historical root cause
- previous successful approaches
- previous failed approaches
- relevant lesson

## Recall rules

1. Historical memory is evidence, not truth.
2. Current evidence has priority over stale memory.
3. If evidence conflicts, explicitly state the conflict.
4. Do not apply a historical fix automatically.
5. If no relevant memory exists, say so.
6. Relevance must be explainable.
