export type Severity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';
export type IncidentStatus = 'open' | 'investigating' | 'resolved';
export type EvidenceType = 'metric' | 'log' | 'deployment' | 'observation' | 'alert';
export type EvidenceLabel = 'OBSERVED' | 'HISTORICAL' | 'HYPOTHESIS' | 'CONFIRMED' | 'RULED_OUT';

export interface Incident {
  id: string;
  incident_key: string;
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  description: string | null;
  detected_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentEvidence {
  id: string;
  incident_id: string;
  type: EvidenceType;
  name: string;
  value: string | null;
  source: string | null;
  metadata?: Record<string, unknown>;
  recorded_at: string;
}

export interface Investigation {
  id: string;
  incident_id: string;
  status: 'running' | 'completed' | 'paused';
  summary: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface InvestigationStep {
  id: string;
  investigation_id: string;
  step_number: number;
  hypothesis: string | null;
  action: string | null;
  observation: string | null;
  result: string | null;
  status: 'pending' | 'in_progress' | 'confirmed' | 'ruled_out';
  created_at: string;
}

export interface RunbookStep {
  step: number;
  action: string;
}

export interface Runbook {
  id: string;
  name: string;
  service: string | null;
  description: string | null;
  steps: RunbookStep[];
  version: string;
  created_at: string;
  updated_at: string;
}

export interface Resolution {
  id: string;
  incident_id: string;
  root_cause: string | null;
  resolution_summary: string | null;
  runbook_id: string | null;
  resolution_time_minutes: number | null;
  verified: boolean;
  failed_approaches: string[];
  successful_approaches: string[];
  lessons_learned: string | null;
  created_at: string;
}

export interface HindsightIncidentExperience {
  type: 'incident_experience';
  service: string;
  incident_key?: string;
  symptoms: string[];
  important_evidence: string[];
  root_cause: string;
  investigation_path: string[];
  failed_approaches: string[];
  successful_approaches: string[];
  runbook?: string;
  outcome: string;
  lesson: string;
}

export interface HistoricalRelevanceExplanation {
  memory_id?: string;
  source_incident_key?: string;
  service: string;
  relevance: 'high' | 'medium' | 'low' | 'divergent';
  similarities: string[];
  differences: string[];
  why_it_matters: string;
  historical_root_cause: string;
  previous_successful_approaches: string[];
  previous_failed_approaches: string[];
  relevant_lesson: string;
  conflicting_evidence?: string;
}
