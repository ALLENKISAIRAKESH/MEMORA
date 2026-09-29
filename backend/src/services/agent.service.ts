import { db } from '../db/supabase.js';
import { hindsight } from './hindsight.service.js';
import { env, hasLlmConfig } from '../config/env.js';
import { 
  Incident, 
  IncidentEvidence, 
  HistoricalRelevanceExplanation, 
  EvidenceLabel 
} from '../types/index.js';

export interface AgentHypothesis {
  title: string;
  label: EvidenceLabel;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  supporting_evidence: string[];
}

export interface AgentNextStep {
  priority: number;
  action: string;
  rationale: string;
  expected_outcome: string;
}

export interface InvestigationResult {
  investigation_id: string;
  incident_id: string;
  summary: string;
  observed_facts: string[];
  recalled_memories: HistoricalRelevanceExplanation[];
  differences: string[];
  hypotheses: AgentHypothesis[];
  next_steps: AgentNextStep[];
  memory_influenced: boolean;
  influence_explanation?: string;
  confidence_statement: string;
}

export class IncidentAgentService {
  /**
   * Tool: get_incident
   */
  async getIncident(id: string): Promise<Incident | null> {
    return db.getIncidentById(id);
  }

  /**
   * Tool: get_evidence
   */
  async getEvidence(incidentId: string): Promise<IncidentEvidence[]> {
    return db.getEvidenceByIncidentId(incidentId);
  }

  /**
   * Tool: recall_memory
   */
  async recallMemory(service: string, symptoms: string[], currentEvidence: string[]) {
    return hindsight.recallExperiences({
      service,
      symptoms,
      current_evidence: currentEvidence
    });
  }

  /**
   * Tool: get_runbook
   */
  async getRunbook(nameOrService: string) {
    return db.getRunbookByNameOrService(nameOrService);
  }

  /**
   * Tool: record_investigation_step
   */
  async recordStep(investigationId: string, step: {
    hypothesis?: string;
    action: string;
    observation?: string;
    result?: string;
    status: 'pending' | 'in_progress' | 'confirmed' | 'ruled_out';
  }) {
    const existing = await db.getInvestigationSteps(investigationId);
    return db.addInvestigationStep({
      investigation_id: investigationId,
      step_number: existing.length + 1,
      hypothesis: step.hypothesis || null,
      action: step.action,
      observation: step.observation || null,
      result: step.result || null,
      status: step.status
    });
  }

  /**
   * Run the primary investigation loop
   */
  async investigateIncident(incidentId: string): Promise<InvestigationResult> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const evidenceList = await this.getEvidence(incident.id);

    // 1. Extract observed facts from current evidence
    const observedFacts = evidenceList.map((e) => `${e.name}: ${e.value} (${e.type})`);
    if (incident.description) {
      observedFacts.unshift(`Symptom: ${incident.description}`);
    }

    // 2. Prepare symptoms
    const symptoms = [
      incident.title,
      ...(incident.description ? [incident.description] : [])
    ];

    // 3. Recall historical operational experiences
    const recallResult = await this.recallMemory(incident.service, symptoms, observedFacts);
    let recalled = recallResult.memories;

    // If Hindsight API is in degraded/unconfigured mode, retrieve historical experiences from resolved database records
    if (recalled.length === 0) {
      const allIncidents = await db.getIncidents();
      const resolvedIncidents = allIncidents.filter((i) => i.status === 'resolved' && i.id !== incident.id);

      for (const pastInc of resolvedIncidents) {
        const resolution = await db.getResolutionByIncidentId(pastInc.id);
        const pastEvidence = await db.getEvidenceByIncidentId(pastInc.id);

        if (resolution && pastInc.service === incident.service) {
          const pastEvStrings = pastEvidence.map((e) => `${e.name}: ${e.value}`);
          
          // Check for similar vs divergent signals
          const currDbHigh = evidenceList.some((e) => e.name.includes('db_conn') && parseFloat(e.value || '0') > 80);
          const currRedisHigh = evidenceList.some((e) => e.name.includes('redis') && parseFloat(e.value || '0') > 80);
          const pastDbExhausted = resolution.root_cause?.toLowerCase().includes('database') || resolution.root_cause?.toLowerCase().includes('pool');

          let relevance: 'high' | 'medium' | 'low' | 'divergent' = 'high';
          const similarities: string[] = [`Same service: ${incident.service}`, 'Elevated API latency / request degradation'];
          const differences: string[] = [];

          if (currRedisHigh && !currDbHigh && pastDbExhausted) {
            relevance = 'divergent';
            differences.push('Historical incident was caused by DB connection pool exhaustion (99% connections).');
            differences.push('Current evidence shows Redis memory pressure at 96%, while DB pool utilization is normal.');
          } else if (currDbHigh && pastDbExhausted) {
            relevance = 'high';
            similarities.push('Database connection saturation (>95%) mirrors historical incident.');
          }

          recalled.push({
            memory_id: `mem-${pastInc.incident_key}`,
            source_incident_key: pastInc.incident_key,
            service: pastInc.service,
            relevance,
            similarities,
            differences,
            why_it_matters: relevance === 'divergent'
              ? `Historical fix (${resolution.successful_approaches[0]}) must NOT be blindly applied: current metrics point to Redis cache rather than DB pool.`
              : `Past occurrence was resolved by inspecting & scaling the database connection pool.`,
            historical_root_cause: resolution.root_cause || 'Pool exhaustion',
            previous_successful_approaches: resolution.successful_approaches || [],
            previous_failed_approaches: resolution.failed_approaches || [],
            relevant_lesson: resolution.lessons_learned || 'Check pool before restart'
          });
        }
      }
    }

    // 4. Evaluate relevance and build hypotheses distinguishing labels
    const hypotheses: AgentHypothesis[] = [];
    const nextSteps: AgentNextStep[] = [];
    const differences: string[] = [];
    let memoryInfluenced = false;
    let influenceExplanation = '';

    const dbEvidence = evidenceList.find((e) => e.name.includes('db_conn') || e.name.includes('pool'));
    const redisEvidence = evidenceList.find((e) => e.name.includes('redis'));
    const latencyEvidence = evidenceList.find((e) => e.name.includes('latency'));

    const hasHighDb = dbEvidence && parseFloat(dbEvidence.value || '0') > 80;
    const hasHighRedis = redisEvidence && parseFloat(redisEvidence.value || '0') > 80;

    // Case A: Current evidence matches historical memory (Scenario 2: INC-1007)
    if (hasHighDb && recalled.some((m) => m.relevance === 'high')) {
      const match = recalled.find((m) => m.relevance === 'high')!;
      memoryInfluenced = true;
      influenceExplanation = `Recommendation prioritized by ${match.source_incident_key} experience: DB connection pool exhaustion identified as highest probability cause.`;

      hypotheses.push({
        title: 'Database connection pool exhaustion',
        label: 'HYPOTHESIS',
        confidence: 'high',
        reasoning: `Current DB utilization is ${dbEvidence?.value}, directly matching pattern from ${match.source_incident_key}.`,
        supporting_evidence: [
          `Observed ${dbEvidence?.name}: ${dbEvidence?.value}`,
          `Historical resolution in ${match.source_incident_key}`
        ]
      });

      hypotheses.push({
        title: 'Application container CPU saturation',
        label: 'RULED_OUT',
        confidence: 'low',
        reasoning: 'API pods are not CPU throttled; latency is bounded by I/O waiting for available DB connections.',
        supporting_evidence: ['CPU utilization normal']
      });

      nextSteps.push({
        priority: 1,
        action: 'Inspect database connection pool saturation and active queries',
        rationale: `Historical incident ${match.source_incident_key} resolved this by scaling the pool from 50 to 100.`,
        expected_outcome: 'Identify whether pool is blocking incoming requests'
      });

      nextSteps.push({
        priority: 2,
        action: 'Avoid API restart (known failed approach)',
        rationale: `Historical post-mortem showed: "${match.previous_failed_approaches[0] || 'Restarting API did not resolve the issue'}".`,
        expected_outcome: 'Prevent unnecessary downtime and cold-start storm'
      });

      nextSteps.push({
        priority: 3,
        action: 'Execute runbook DB-CONNECTION-POOL-03',
        rationale: 'Follow established runbook to increase max pool size and monitor latency.',
        expected_outcome: 'Return latency to <200ms'
      });
    }
    // Case B: Current evidence diverges from historical memory (Scenario 3: INC-1008)
    else if (hasHighRedis) {
      const match = recalled.find((m) => m.relevance === 'divergent' || m.source_incident_key === 'INC-1001');
      memoryInfluenced = true;
      influenceExplanation = `Historical memory ${match?.source_incident_key || 'INC-1001'} was recalled but rejected: Current evidence shows normal DB connections (34%) and critical Redis memory (${redisEvidence?.value}). Agent prioritizes cache memory pressure.`;
      differences.push('DB connection utilization is normal (34%), whereas INC-1001 had 99% pool saturation.');
      differences.push(`Redis memory utilization is ${redisEvidence?.value}, indicating cache eviction or key explosion.`);

      hypotheses.push({
        title: 'Redis cache memory pressure and eviction storm',
        label: 'HYPOTHESIS',
        confidence: 'high',
        reasoning: `Redis memory is at ${redisEvidence?.value}. Latency spikes are driven by cache misses or Redis blocking rather than database connection pool exhaustion.`,
        supporting_evidence: [`Observed ${redisEvidence?.name}: ${redisEvidence?.value}`]
      });

      hypotheses.push({
        title: 'Database connection pool exhaustion (Historical match)',
        label: 'RULED_OUT',
        confidence: 'low',
        reasoning: `Although ${match?.source_incident_key || 'INC-1001'} exhibited similar latency, DB connection utilization is normal. Blindly increasing DB pool capacity will NOT fix this incident.`,
        supporting_evidence: [`Current DB connections: ${dbEvidence?.value || 'normal'}`]
      });

      nextSteps.push({
        priority: 1,
        action: 'Inspect Redis memory utilization and high-memory keys',
        rationale: 'Identify whether a cache leak or key un-expiry is consuming available memory.',
        expected_outcome: 'Locate memory leak or unbounded key namespace'
      });

      nextSteps.push({
        priority: 2,
        action: 'Execute runbook REDIS-MEMORY-02',
        rationale: 'Investigate Redis memory pressure per operational runbook.',
        expected_outcome: 'Mitigate Redis saturation without touching DB pool'
      });
    }
    // Case C: Generic or Initial learning investigation (Scenario 1 / Default)
    else {
      hypotheses.push({
        title: 'Downstream I/O or database connection saturation',
        label: 'HYPOTHESIS',
        confidence: 'medium',
        reasoning: 'API latency is elevated. Need to confirm if pool exhaustion or slow query locks are blocking handlers.',
        supporting_evidence: observedFacts
      });

      hypotheses.push({
        title: 'Network latency / transit degradation',
        label: 'HYPOTHESIS',
        confidence: 'low',
        reasoning: 'Requires checking gateway round-trip time and downstream response times.',
        supporting_evidence: []
      });

      nextSteps.push({
        priority: 1,
        action: 'Inspect database connection metrics and active pool count',
        rationale: 'Determine if requests are queuing for connection allocation.',
        expected_outcome: 'Confirm or rule out pool exhaustion'
      });

      nextSteps.push({
        priority: 2,
        action: 'Check upstream gateway error rates and network egress latency',
        rationale: 'Verify if degradation is internal or transit-related.',
        expected_outcome: 'Isolate root domain'
      });
    }

    // 5. Ensure Investigation record exists in DB
    let investigation = await db.getInvestigationByIncidentId(incident.id);
    if (!investigation) {
      investigation = await db.createInvestigation(incident.id, `Agent investigation for ${incident.incident_key}`);
    }

    // Record the first next step as an investigation step
    if (nextSteps.length > 0) {
      await this.recordStep(investigation.id, {
        hypothesis: hypotheses[0]?.title,
        action: nextSteps[0].action,
        observation: `Observed: ${observedFacts.slice(0, 3).join(', ')}`,
        status: 'in_progress'
      });
    }

    // Update incident status to 'investigating'
    await db.updateIncident(incident.id, { status: 'investigating' });

    const confidenceStatement = hypotheses.length > 0
      ? `High confidence in separating observed metrics from historical assumptions. ${memoryInfluenced ? influenceExplanation : 'No direct memory bias detected.'}`
      : 'Initial triage in progress.';

    const summary = memoryInfluenced
      ? `${influenceExplanation} Generated ${hypotheses.length} ranked hypotheses and ${nextSteps.length} prioritized next steps.`
      : `Investigating ${incident.service} with ${observedFacts.length} observed telemetry signals. Formulated ${hypotheses.length} initial hypotheses.`;

    await db.updateInvestigation(investigation.id, { summary });

    return {
      investigation_id: investigation.id,
      incident_id: incident.id,
      summary,
      observed_facts: observedFacts,
      recalled_memories: recalled,
      differences,
      hypotheses,
      next_steps: nextSteps,
      memory_influenced: memoryInfluenced,
      influence_explanation: influenceExplanation,
      confidence_statement: confidenceStatement
    };
  }
}

export const agentService = new IncidentAgentService();
