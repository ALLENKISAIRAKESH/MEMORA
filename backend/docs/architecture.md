# Memora Technical Architecture

## System

React/Vite frontend
        |
        v
Node/Express API
        |
   +----+-------------------+
   |                        |
   v                        v
Supabase PostgreSQL      Incident Agent
                              |
                 +------------+-------------+
                 |                          |
                 v                          v
           Hindsight                    Agent Tools
           Memory                       |
                                        +-- incident evidence
                                        +-- runbooks
                                        +-- investigation state

## Data ownership

PostgreSQL:
- users
- incidents
- evidence
- investigation records
- investigation steps
- resolutions
- runbooks
- audit/application state

Hindsight:
- reusable incident experiences
- successful/failed approaches
- historical lessons
- contextual operational knowledge

## Design rule

PostgreSQL is the source of truth for application state.
Hindsight is the source of reusable agent experience.

## Agent loop

1. Load incident.
2. Load evidence.
3. Construct recall query.
4. Recall relevant experiences.
5. Evaluate relevance.
6. Build hypotheses.
7. Generate prioritized next steps.
8. Record investigation steps.
9. Re-evaluate after new evidence.
10. Confirm root cause only when supported.
11. Capture resolution.
12. Extract reusable experience.
13. Retain experience in Hindsight.

## Agent tools

MVP:
- get_incident
- get_evidence
- recall_memory
- get_runbook
- record_investigation_step
- record_resolution

Future:
- get_metrics
- search_logs
- get_deployment

Do not add destructive tools until there is a concrete need and human approval flow.

## Evidence labels

Every important statement shown in the UI should be categorized as one of:
- OBSERVED
- HISTORICAL
- HYPOTHESIS
- CONFIRMED
- RULED_OUT

## Error handling

If Hindsight is unavailable:
- do not silently pretend memory worked
- show a degraded-memory state
- allow investigation to continue with current evidence
- log the failure
- make the demo/test detect the degraded state

If no relevant memory exists:
- say that explicitly
- start a fresh investigation

If historical memory conflicts with current evidence:
- current evidence wins
- show the conflict
- explain why the old memory is not being followed

## Security

- Keep secrets server-side.
- Never expose Hindsight or LLM API keys to the frontend.
- Validate all API inputs.
- Sanitize log rendering.
- Add authorization checks before incident mutations.
- Avoid storing secrets found in logs as long-term memory.
