import { HindsightClient } from '@vectorize-io/hindsight-client';
import { env, hasHindsightConfig } from '../config/env.js';
import { HindsightIncidentExperience, HistoricalRelevanceExplanation } from '../types/index.js';

export class HindsightConfigurationError extends Error {
  constructor(message: string = 'HINDSIGHT_API_KEY is not configured in .env') {
    super(message);
    this.name = 'HindsightConfigurationError';
  }
}

export class HindsightService {
  private client: HindsightClient | null = null;
  private bankId: string;

  constructor() {
    this.bankId = env.HINDSIGHT_BANK_ID || 'memora-ops';
    if (hasHindsightConfig) {
      try {
        this.client = new HindsightClient({
          baseUrl: env.HINDSIGHT_API_URL,
          apiKey: env.HINDSIGHT_API_KEY
        });
        console.log(`[Hindsight] Initialized client for bank '${this.bankId}' at ${env.HINDSIGHT_API_URL}`);
      } catch (err) {
        console.error('[Hindsight] Initialization error:', err);
      }
    } else {
      console.warn('[Hindsight] Service started without HINDSIGHT_API_KEY. Real memory calls will stop at the integration boundary.');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client && env.HINDSIGHT_API_KEY);
  }

  getBankId(): string {
    return this.bankId;
  }

  /**
   * Retain a resolved incident experience in Hindsight
   * Retain rules:
   * - Retain only after resolution
   * - Never fabricate root cause
   * - Never retain secrets
   * - Store structured experience with failed and successful approaches
   */
  async retainExperience(experience: HindsightIncidentExperience): Promise<{
    success: boolean;
    operationId?: string;
    bankId: string;
  }> {
    if (!this.client || !env.HINDSIGHT_API_KEY) {
      throw new HindsightConfigurationError(
        'Cannot retain memory: HINDSIGHT_API_KEY is not configured. Please supply your Hindsight credentials in .env.'
      );
    }

    // Format content in natural, structured operational language optimized for semantic recall
    const content = `
[INCIDENT EXPERIENCE: ${experience.service.toUpperCase()}]
Source Incident: ${experience.incident_key || 'UNKNOWN'}
Service: ${experience.service}
Symptoms: ${experience.symptoms.join(', ')}
Important Evidence: ${experience.important_evidence.join(', ')}
Root Cause: ${experience.root_cause}
Investigation Path:
${experience.investigation_path.map((p) => ` - ${p}`).join('\n')}
Failed Approaches (Do not repeat):
${experience.failed_approaches.map((a) => ` - ${a}`).join('\n')}
Successful Approaches (Verified fix):
${experience.successful_approaches.map((a) => ` - ${a}`).join('\n')}
Runbook: ${experience.runbook || 'N/A'}
Outcome: ${experience.outcome}
Generalizable Lesson: ${experience.lesson}
`.trim();

    try {
      const response = await this.client.retain(this.bankId, content, {
        context: `Incident operational experience for ${experience.service}`,
        tags: [
          'incident_experience',
          experience.service,
          ...(experience.incident_key ? [experience.incident_key] : [])
        ],
        metadata: {
          service: experience.service,
          root_cause: experience.root_cause,
          source_incident: experience.incident_key || ''
        }
      });

      return {
        success: true,
        operationId: (response as any).operation_id || (response as any).id,
        bankId: this.bankId
      };
    } catch (err: any) {
      console.error('[Hindsight] Error during retain call:', err);
      throw new Error(`Hindsight retain operation failed: ${err.message}`);
    }
  }

  /**
   * Recall experiences from Hindsight based on current incident signals
   */
  async recallExperiences(queryContext: {
    service: string;
    symptoms: string[];
    current_evidence?: string[];
  }): Promise<{
    memories: HistoricalRelevanceExplanation[];
    degraded: boolean;
    reason?: string;
  }> {
    if (!this.client || !env.HINDSIGHT_API_KEY) {
      // Degraded-memory state as defined in docs/architecture.md & contracts/hindsight-memory-contract.md
      return {
        memories: [],
        degraded: true,
        reason: 'Hindsight credentials not configured (HINDSIGHT_API_KEY missing)'
      };
    }

    const query = [
      `Service: ${queryContext.service}`,
      `Symptoms: ${queryContext.symptoms.join(', ')}`,
      queryContext.current_evidence && queryContext.current_evidence.length > 0
        ? `Evidence: ${queryContext.current_evidence.join(', ')}`
        : ''
    ].filter(Boolean).join(' | ');

    try {
      const recallResponse = await this.client.recall(this.bankId, query, {
        budget: 'low'
      });

      // Normalize results into HistoricalRelevanceExplanation
      const rawMemories = (recallResponse as any).memories || (recallResponse as any).items || [];
      const normalized: HistoricalRelevanceExplanation[] = rawMemories.map((m: any) => {
        const text = m.content || m.text || '';
        return {
          memory_id: m.id,
          source_incident_key: m.metadata?.source_incident || 'HISTORICAL-INCIDENT',
          service: m.metadata?.service || queryContext.service,
          relevance: 'high',
          similarities: [queryContext.service, ...queryContext.symptoms],
          differences: [],
          why_it_matters: `Previous occurrence with similar symptoms: ${text.slice(0, 100)}...`,
          historical_root_cause: m.metadata?.root_cause || 'Identified in past post-mortem',
          previous_successful_approaches: ['Refer to historical resolution'],
          previous_failed_approaches: ['Ruled-out approaches in post-mortem'],
          relevant_lesson: text.slice(0, 120)
        };
      });

      return {
        memories: normalized,
        degraded: false
      };
    } catch (err: any) {
      console.warn('[Hindsight] Recall query failed:', err.message);
      return {
        memories: [],
        degraded: true,
        reason: `Hindsight query failed: ${err.message}`
      };
    }
  }

  /**
   * List memories in the bank
   */
  async listMemories(limit: number = 20) {
    if (!this.client || !env.HINDSIGHT_API_KEY) {
      return {
        items: [],
        degraded: true,
        reason: 'HINDSIGHT_API_KEY not configured'
      };
    }

    try {
      const result = await this.client.listMemories(this.bankId, { limit });
      return {
        items: (result as any).items || [],
        degraded: false
      };
    } catch (err: any) {
      return {
        items: [],
        degraded: true,
        reason: err.message
      };
    }
  }
}

export const hindsight = new HindsightService();
