# Memora UI Specification

## Visual direction

Dark, technical, calm, observability-inspired interface.

Avoid:
- excessive gradients
- fake futuristic decoration
- giant marketing hero sections inside the app
- cluttered dashboards

Prioritize:
- information density
- hierarchy
- readable evidence
- incident state
- memory visibility

## Pages

### Dashboard
Cards:
- Active incidents
- Critical incidents
- Resolved incidents
- Historical memories
- Average resolution time

Charts:
- incidents over time
- severity distribution
- resolution trend

### Incidents
Table:
- key
- title
- service
- severity
- status
- detected
- resolution time

### Incident Workspace
Three-column layout:

LEFT:
- incident details
- symptoms
- evidence
- timeline

CENTER:
- investigation
- hypotheses
- next actions
- investigation steps

RIGHT:
- Hindsight memory
- similar incidents
- relevance
- historical root causes
- previous fixes

### Memory
Show:
- incident experience
- service
- symptoms
- root cause
- failed approaches
- successful approaches
- lesson
- source incident

### Resolution
Form:
- root cause
- resolution
- failed approaches
- successful approaches
- runbook
- lesson learned
- verification

## Critical interaction

When historical memory affects an investigation, the UI must make that causal relationship visible.

Example:
"Recommendation influenced by INC-1001 because current DB connection utilization matches the historical symptom."
