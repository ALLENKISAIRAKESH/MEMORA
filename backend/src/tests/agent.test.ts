import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/supabase.js';
import { agentService } from '../services/agent.service.js';

test('Agent Investigation - Scenario 2: Memory Changes Behavior', async () => {
  // Create INC-1007 (similar to INC-1001)
  const inc = await db.createIncident({
    incident_key: 'INC-1007-TEST',
    title: 'Payment API latency elevated',
    service: 'payment-api',
    severity: 'SEV-1',
    status: 'open',
    description: 'API latency 4.8s, timeouts increasing',
    detected_at: new Date().toISOString(),
    resolved_at: null
  });

  await db.addEvidence({
    incident_id: inc.id,
    type: 'metric',
    name: 'api_latency',
    value: '4.8s',
    source: 'synthetic-monitoring'
  });

  await db.addEvidence({
    incident_id: inc.id,
    type: 'metric',
    name: 'db_connections',
    value: '97%',
    source: 'synthetic-monitoring'
  });

  // Run agent investigation
  const result = await agentService.investigateIncident(inc.id);

  assert.equal(result.incident_id, inc.id);
  assert.equal(result.memory_influenced, true, 'Investigation should be influenced by historical memory');
  assert.ok(result.recalled_memories.length > 0, 'Should have recalled historical memory');

  // Verify prioritized hypothesis
  const topHypothesis = result.hypotheses[0];
  assert.match(topHypothesis.title.toLowerCase(), /database|connection|pool/);
  assert.equal(topHypothesis.label, 'HYPOTHESIS');

  // Verify next steps avoid known failed approach
  const nextStepsActions = result.next_steps.map((s) => s.action.toLowerCase()).join(' ');
  assert.match(nextStepsActions, /database connection pool|db-connection-pool-03/);
  assert.match(nextStepsActions, /avoid api restart/);

  // Clean up
  await db.deleteIncident(inc.id);
});

test('Agent Investigation - Scenario 3: Memory Must Not Become Bias (Divergence)', async () => {
  // Create INC-1008 (similar latency, but DB normal and Redis critical)
  const inc = await db.createIncident({
    incident_key: 'INC-1008-TEST',
    title: 'Payment API latency elevated',
    service: 'payment-api',
    severity: 'SEV-2',
    status: 'open',
    description: 'API latency 4.8s, DB connections normal, Redis memory 96%',
    detected_at: new Date().toISOString(),
    resolved_at: null
  });

  await db.addEvidence({
    incident_id: inc.id,
    type: 'metric',
    name: 'api_latency',
    value: '4.8s',
    source: 'synthetic-monitoring'
  });

  await db.addEvidence({
    incident_id: inc.id,
    type: 'metric',
    name: 'db_connections',
    value: '34%',
    source: 'synthetic-monitoring'
  });

  await db.addEvidence({
    incident_id: inc.id,
    type: 'metric',
    name: 'redis_memory',
    value: '96%',
    source: 'synthetic-monitoring'
  });

  // Run agent investigation
  const result = await agentService.investigateIncident(inc.id);

  assert.equal(result.incident_id, inc.id);
  assert.ok(result.differences.length > 0, 'Must articulate differences between current evidence and past incident');

  // Verify the agent does NOT recommend the old DB fix, but prioritizes Redis
  const topHypothesis = result.hypotheses[0];
  assert.match(topHypothesis.title.toLowerCase(), /redis/);

  // Verify DB pool is ruled out or deprioritized
  const dbHypothesis = result.hypotheses.find((h) => h.title.toLowerCase().includes('database'));
  if (dbHypothesis) {
    assert.equal(dbHypothesis.label, 'RULED_OUT');
  }

  // Next steps should target Redis rather than DB pool
  assert.match(result.next_steps[0].action.toLowerCase(), /redis/);

  // Clean up
  await db.deleteIncident(inc.id);
});
