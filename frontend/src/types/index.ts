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

export interface Investigation {
  id: string;
  incident_id: string;
  status: 'running' | 'completed' | 'paused';
  summary: string | null;
  started_at: string;
  completed_at: string | null;
  steps?: InvestigationStep[];
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

export interface SystemHealth {
  status: string;
  service: string;
  uptime_seconds: number;
  timestamp: string;
  components: {
    supabase: {
      configured: boolean;
      mode: string;
      url: string;
    };
    hindsight: {
      configured: boolean;
      url: string;
      bank_id: string;
      status: string;
    };
    llm: {
      configured: boolean;
      provider: string;
      model: string;
      status: string;
    };
  };
}
