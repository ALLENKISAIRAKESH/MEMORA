import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, hasSupabaseConfig } from '../config/env.js';
import { Incident, IncidentEvidence, Investigation, InvestigationStep, Runbook, Resolution } from '../types/index.js';
import { randomUUID } from 'crypto';

export let supabase: SupabaseClient | null = null;

if (hasSupabaseConfig) {
  try {
    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    supabase = createClient(env.SUPABASE_URL, key);
    console.log('[Database] Connected to Supabase PostgreSQL at:', env.SUPABASE_URL);
  } catch (err) {
    console.warn('[Database] Failed to initialize Supabase client:', err);
  }
} else {
  console.log('[Database] Supabase credentials not set; using active in-memory repository (seeded from database/seed.sql).');
}

// In-memory fallback stores populated with initial seed data from database/seed.sql
const now = new Date();
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();
const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

const inc1Id = 'a1000000-0000-0000-0000-000000000001';
const inc2Id = 'a1000000-0000-0000-0000-000000000002';
const inc3Id = 'a1000000-0000-0000-0000-000000000003';

const runbook1Id = 'b1000000-0000-0000-0000-000000000001';
const runbook2Id = 'b1000000-0000-0000-0000-000000000002';

const mockIncidents: Incident[] = [
  {
    id: inc1Id,
    incident_key: 'INC-1001',
    title: 'Payment API latency',
    service: 'payment-api',
    severity: 'SEV-1',
    status: 'resolved',
    description: 'Payment requests exceeded 5 seconds and timeouts increased.',
    detected_at: thirtyDaysAgo,
    resolved_at: new Date(new Date(thirtyDaysAgo).getTime() + 14 * 60 * 1000).toISOString(),
    created_at: thirtyDaysAgo,
    updated_at: thirtyDaysAgo
  },
  {
    id: inc2Id,
    incident_key: 'INC-1002',
    title: 'Checkout timeout',
    service: 'checkout-api',
    severity: 'SEV-2',
    status: 'resolved',
    description: 'Checkout requests intermittently timed out.',
    detected_at: twentyOneDaysAgo,
    resolved_at: new Date(new Date(twentyOneDaysAgo).getTime() + 19 * 60 * 1000).toISOString(),
    created_at: twentyOneDaysAgo,
    updated_at: twentyOneDaysAgo
  },
  {
    id: inc3Id,
    incident_key: 'INC-1003',
    title: 'Redis memory pressure',
    service: 'payment-api',
    severity: 'SEV-2',
    status: 'resolved',
    description: 'Redis memory utilization crossed the alert threshold.',
    detected_at: fourteenDaysAgo,
    resolved_at: new Date(new Date(fourteenDaysAgo).getTime() + 17 * 60 * 1000).toISOString(),
    created_at: fourteenDaysAgo,
    updated_at: fourteenDaysAgo
  }
];

const mockEvidence: IncidentEvidence[] = [
  {
    id: randomUUID(),
    incident_id: inc1Id,
    type: 'metric',
    name: 'api_latency',
    value: '5.2s',
    source: 'synthetic-monitoring',
    recorded_at: thirtyDaysAgo
  },
  {
    id: randomUUID(),
    incident_id: inc1Id,
    type: 'metric',
    name: 'db_connections',
    value: '99%',
    source: 'synthetic-monitoring',
    recorded_at: thirtyDaysAgo
  },
  {
    id: randomUUID(),
    incident_id: inc1Id,
    type: 'log',
    name: 'payment-api',
    value: 'connection pool exhausted',
    source: 'synthetic-log',
    recorded_at: thirtyDaysAgo
  },
  {
    id: randomUUID(),
    incident_id: inc3Id,
    type: 'metric',
    name: 'redis_memory',
    value: '94%',
    source: 'synthetic-monitoring',
    recorded_at: fourteenDaysAgo
  }
];

const mockRunbooks: Runbook[] = [
  {
    id: runbook1Id,
    name: 'DB-CONNECTION-POOL-03',
    service: 'payment-api',
    description: 'Investigate and remediate database connection pool exhaustion.',
    steps: [
      { step: 1, action: 'Inspect connection utilization' },
      { step: 2, action: 'Compare pool configuration' },
      { step: 3, action: 'Increase pool if evidence supports exhaustion' },
      { step: 4, action: 'Verify latency and connection recovery' }
    ],
    version: '1.0',
    created_at: thirtyDaysAgo,
    updated_at: thirtyDaysAgo
  },
  {
    id: runbook2Id,
    name: 'REDIS-MEMORY-02',
    service: 'payment-api',
    description: 'Investigate Redis memory pressure.',
    steps: [
      { step: 1, action: 'Inspect memory utilization' },
      { step: 2, action: 'Identify high-memory keys' },
      { step: 3, action: 'Check recent cache changes' },
      { step: 4, action: 'Verify recovery' }
    ],
    version: '1.0',
    created_at: fourteenDaysAgo,
    updated_at: fourteenDaysAgo
  }
];

const mockResolutions: Resolution[] = [
  {
    id: randomUUID(),
    incident_id: inc1Id,
    root_cause: 'Database connection pool exhaustion',
    resolution_summary: 'Increased database connection pool capacity from 50 to 100 and verified latency recovery.',
    runbook_id: runbook1Id,
    resolution_time_minutes: 14,
    verified: true,
    failed_approaches: [
      'Restarting the API did not resolve the issue',
      'Increasing request timeout did not resolve the issue'
    ],
    successful_approaches: [
      'Inspecting DB connection utilization exposed the exhausted pool',
      'Increasing pool capacity restored normal behavior'
    ],
    lessons_learned: 'When payment-api latency coincides with high database connection utilization, inspect the connection pool before restarting the service.',
    created_at: thirtyDaysAgo
  }
];

const mockInvestigations: Investigation[] = [];
const mockInvestigationSteps: InvestigationStep[] = [];

// Repository API
export const db = {
  // Incidents
  async getIncidents(): Promise<Incident[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('detected_at', { ascending: false });
      if (!error && data) return data as Incident[];
      console.warn('[Database] Supabase query failed, using local store:', error?.message);
    }
    return [...mockIncidents].sort(
      (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    );
  },

  async getIncidentById(id: string): Promise<Incident | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .or(`id.eq.${id},incident_key.eq.${id}`)
        .single();
      if (!error && data) return data as Incident;
    }
    const found = mockIncidents.find((i) => i.id === id || i.incident_key === id);
    return found || null;
  },

  async createIncident(incidentData: Omit<Incident, 'id' | 'created_at' | 'updated_at'>): Promise<Incident> {
    const newIncident: Incident = {
      ...incidentData,
      id: randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('incidents')
        .insert([newIncident])
        .select()
        .single();
      if (!error && data) return data as Incident;
      console.warn('[Database] Supabase insert failed, persisting locally:', error?.message);
    }

    mockIncidents.unshift(newIncident);
    return newIncident;
  },

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const updatedAt = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('incidents')
        .update({ ...updates, updated_at: updatedAt })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Incident;
    }

    const index = mockIncidents.findIndex((i) => i.id === id || i.incident_key === id);
    if (index === -1) return null;
    mockIncidents[index] = { ...mockIncidents[index], ...updates, updated_at: updatedAt };
    return mockIncidents[index];
  },

  // Evidence
  async getEvidenceByIncidentId(incidentId: string): Promise<IncidentEvidence[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('incident_evidence')
        .select('*')
        .eq('incident_id', incidentId)
        .order('recorded_at', { ascending: true });
      if (!error && data) return data as IncidentEvidence[];
    }
    return mockEvidence.filter((e) => e.incident_id === incidentId);
  },

  async addEvidence(evidenceData: Omit<IncidentEvidence, 'id' | 'recorded_at'>): Promise<IncidentEvidence> {
    const item: IncidentEvidence = {
      ...evidenceData,
      id: randomUUID(),
      recorded_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('incident_evidence')
        .insert([item])
        .select()
        .single();
      if (!error && data) return data as IncidentEvidence;
    }

    mockEvidence.push(item);
    return item;
  },

  // Investigations
  async getInvestigationByIncidentId(incidentId: string): Promise<Investigation | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('investigations')
        .select('*')
        .eq('incident_id', incidentId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) return data as Investigation;
    }
    const found = mockInvestigations.find((inv) => inv.incident_id === incidentId);
    return found || null;
  },

  async createInvestigation(incidentId: string, summary?: string): Promise<Investigation> {
    const item: Investigation = {
      id: randomUUID(),
      incident_id: incidentId,
      status: 'running',
      summary: summary || null,
      started_at: new Date().toISOString(),
      completed_at: null
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('investigations')
        .insert([item])
        .select()
        .single();
      if (!error && data) return data as Investigation;
    }

    mockInvestigations.push(item);
    return item;
  },

  // Investigation Steps
  async getInvestigationSteps(investigationId: string): Promise<InvestigationStep[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('investigation_steps')
        .select('*')
        .eq('investigation_id', investigationId)
        .order('step_number', { ascending: true });
      if (!error && data) return data as InvestigationStep[];
    }
    return mockInvestigationSteps
      .filter((s) => s.investigation_id === investigationId)
      .sort((a, b) => a.step_number - b.step_number);
  },

  async addInvestigationStep(stepData: Omit<InvestigationStep, 'id' | 'created_at'>): Promise<InvestigationStep> {
    const step: InvestigationStep = {
      ...stepData,
      id: randomUUID(),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('investigation_steps')
        .insert([step])
        .select()
        .single();
      if (!error && data) return data as InvestigationStep;
    }

    mockInvestigationSteps.push(step);
    return step;
  },

  // Runbooks
  async updateInvestigation(id: string, updates: Partial<Investigation>): Promise<Investigation | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('investigations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Investigation;
    }
    const idx = mockInvestigations.findIndex((inv) => inv.id === id);
    if (idx === -1) return null;
    mockInvestigations[idx] = { ...mockInvestigations[idx], ...updates };
    return mockInvestigations[idx];
  },

  async updateInvestigationStep(id: string, updates: Partial<InvestigationStep>): Promise<InvestigationStep | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('investigation_steps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as InvestigationStep;
    }
    const idx = mockInvestigationSteps.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    mockInvestigationSteps[idx] = { ...mockInvestigationSteps[idx], ...updates };
    return mockInvestigationSteps[idx];
  },

  async deleteEvidence(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('incident_evidence').delete().eq('id', id);
      if (!error) return true;
    }
    const idx = mockEvidence.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    mockEvidence.splice(idx, 1);
    return true;
  },

  async deleteIncident(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('incidents').delete().eq('id', id);
      if (!error) return true;
    }
    const idx = mockIncidents.findIndex((i) => i.id === id || i.incident_key === id);
    if (idx === -1) return false;
    mockIncidents.splice(idx, 1);
    return true;
  },

  // Runbooks
  async getRunbooks(): Promise<Runbook[]> {
    if (supabase) {
      const { data, error } = await supabase.from('runbooks').select('*');
      if (!error && data) return data as Runbook[];
    }
    return mockRunbooks;
  },

  async getRunbookById(id: string): Promise<Runbook | null> {
    if (supabase) {
      const { data, error } = await supabase.from('runbooks').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data as Runbook;
    }
    return mockRunbooks.find((r) => r.id === id) || null;
  },

  async getRunbookByNameOrService(nameOrService: string): Promise<Runbook | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('runbooks')
        .select('*')
        .or(`name.eq.${nameOrService},service.eq.${nameOrService}`)
        .limit(1)
        .maybeSingle();
      if (!error && data) return data as Runbook;
    }
    return (
      mockRunbooks.find(
        (r) => r.name.toLowerCase() === nameOrService.toLowerCase() || r.service?.toLowerCase() === nameOrService.toLowerCase()
      ) || null
    );
  },

  async createRunbook(runbookData: Omit<Runbook, 'id' | 'created_at' | 'updated_at'>): Promise<Runbook> {
    const item: Runbook = {
      ...runbookData,
      id: randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (supabase) {
      const { data, error } = await supabase.from('runbooks').insert([item]).select().single();
      if (!error && data) return data as Runbook;
    }
    mockRunbooks.push(item);
    return item;
  },

  // Resolutions
  async getResolutionByIncidentId(incidentId: string): Promise<Resolution | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('resolutions')
        .select('*')
        .eq('incident_id', incidentId)
        .maybeSingle();
      if (!error && data) return data as Resolution;
    }
    return mockResolutions.find((r) => r.incident_id === incidentId) || null;
  },

  async saveResolution(resolutionData: Omit<Resolution, 'id' | 'created_at'>): Promise<Resolution> {
    const item: Resolution = {
      ...resolutionData,
      id: randomUUID(),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('resolutions')
        .upsert([item], { onConflict: 'incident_id' })
        .select()
        .single();
      if (!error && data) return data as Resolution;
    }

    const existingIndex = mockResolutions.findIndex((r) => r.incident_id === item.incident_id);
    if (existingIndex >= 0) {
      mockResolutions[existingIndex] = item;
    } else {
      mockResolutions.push(item);
    }
    return item;
  }
};
