import type { Incident, IncidentEvidence, SystemHealth } from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
  return res.json();
}

export async function fetchIncident(id: string): Promise<Incident & {
  evidence: IncidentEvidence[];
  investigation: any;
  resolution: any;
}> {
  const res = await fetch(`${API_BASE}/incidents/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch incident ${id}: ${res.statusText}`);
  return res.json();
}

export async function createIncident(data: {
  title: string;
  service: string;
  severity: string;
  description?: string;
  incident_key?: string;
}): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create incident: ${res.statusText}`);
  }
  return res.json();
}

export async function addEvidence(incidentId: string, data: {
  type: string;
  name: string;
  value?: string;
  source?: string;
}): Promise<IncidentEvidence> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to add evidence: ${res.statusText}`);
  return res.json();
}
