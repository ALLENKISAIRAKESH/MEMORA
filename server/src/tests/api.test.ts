import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/supabase.js';

test('Database Repository - Incidents CRUD', async () => {
  // 1. Get initial seeded incidents
  const initial = await db.getIncidents();
  assert.ok(initial.length >= 3, 'Should have at least 3 seeded incidents');
  const inc1001 = initial.find((i) => i.incident_key === 'INC-1001');
  assert.ok(inc1001, 'Should find INC-1001');
  assert.equal(inc1001.service, 'payment-api');

  // 2. Create a new incident
  const created = await db.createIncident({
    incident_key: 'INC-TEST-01',
    title: 'Test Database Failure',
    service: 'auth-service',
    severity: 'SEV-1',
    status: 'open',
    description: 'Unit test verification incident',
    detected_at: new Date().toISOString(),
    resolved_at: null
  });
  assert.ok(created.id, 'Created incident should have an ID');
  assert.equal(created.incident_key, 'INC-TEST-01');

  // 3. Read back single incident
  const fetched = await db.getIncidentById(created.id);
  assert.ok(fetched, 'Should fetch created incident');
  assert.equal(fetched.title, 'Test Database Failure');

  // 4. Update incident
  const updated = await db.updateIncident(created.id, {
    status: 'investigating',
    description: 'Updated investigation in progress'
  });
  assert.ok(updated);
  assert.equal(updated.status, 'investigating');
  assert.equal(updated.description, 'Updated investigation in progress');

  // 5. Clean up test incident
  const deleted = await db.deleteIncident(created.id);
  assert.equal(deleted, true);
});

test('Database Repository - Evidence CRUD', async () => {
  const inc1 = await db.getIncidentById('INC-1001');
  assert.ok(inc1, 'INC-1001 must exist');

  // 1. Read existing evidence
  const initialEvidence = await db.getEvidenceByIncidentId(inc1.id);
  assert.ok(initialEvidence.length >= 2, 'Should have initial evidence');

  // 2. Add new evidence
  const added = await db.addEvidence({
    incident_id: inc1.id,
    type: 'metric',
    name: 'test_metric',
    value: '99.5%',
    source: 'test-runner',
    metadata: { test: true }
  });
  assert.ok(added.id);
  assert.equal(added.name, 'test_metric');

  // 3. Verify evidence list contains added evidence
  const afterAdd = await db.getEvidenceByIncidentId(inc1.id);
  assert.ok(afterAdd.some((e) => e.id === added.id));

  // 4. Delete evidence
  const deleted = await db.deleteEvidence(added.id);
  assert.equal(deleted, true);
});

test('Database Repository - Investigations and Steps', async () => {
  const inc1 = await db.getIncidentById('INC-1001');
  assert.ok(inc1);

  // 1. Create investigation
  const inv = await db.createInvestigation(inc1.id, 'Investigation into DB pool saturation');
  assert.ok(inv.id);
  assert.equal(inv.status, 'running');

  // 2. Add investigation steps
  const step1 = await db.addInvestigationStep({
    investigation_id: inv.id,
    step_number: 1,
    hypothesis: 'Pool exhaustion',
    action: 'Check connection count',
    observation: 'Pool at 100/100',
    result: 'Exhausted',
    status: 'confirmed'
  });
  assert.ok(step1.id);
  assert.equal(step1.step_number, 1);

  // 3. Read steps
  const steps = await db.getInvestigationSteps(inv.id);
  assert.ok(steps.length >= 1);
  assert.equal(steps[0].status, 'confirmed');
});

test('Database Repository - Runbooks and Resolutions', async () => {
  // 1. Get seeded runbooks
  const runbooks = await db.getRunbooks();
  assert.ok(runbooks.length >= 2, 'Should have seeded runbooks');
  const poolRunbook = await db.getRunbookByNameOrService('DB-CONNECTION-POOL-03');
  assert.ok(poolRunbook, 'Should find DB-CONNECTION-POOL-03');
  assert.equal(poolRunbook.service, 'payment-api');

  // 2. Resolutions
  const inc1 = await db.getIncidentById('INC-1001');
  assert.ok(inc1);
  const resolution = await db.getResolutionByIncidentId(inc1.id);
  assert.ok(resolution, 'Should have resolution for INC-1001');
  assert.equal(resolution.root_cause, 'Database connection pool exhaustion');
  assert.ok(resolution.successful_approaches.length > 0);
  assert.ok(resolution.failed_approaches.length > 0);
});
