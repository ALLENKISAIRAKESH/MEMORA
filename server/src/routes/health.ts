import { Router, Request, Response } from 'express';
import { env, hasSupabaseConfig, hasHindsightConfig, hasLlmConfig } from '../config/env.js';

export const healthRouter = Router();

const startTime = Date.now();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'memora-api',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    components: {
      supabase: {
        configured: hasSupabaseConfig,
        mode: hasSupabaseConfig ? 'remote-postgresql' : 'active-local-seeded-repository',
        url: hasSupabaseConfig ? env.SUPABASE_URL : 'internal-store'
      },
      hindsight: {
        configured: hasHindsightConfig,
        url: env.HINDSIGHT_API_URL,
        bank_id: env.HINDSIGHT_BANK_ID,
        status: hasHindsightConfig ? 'ready' : 'missing_api_key'
      },
      llm: {
        configured: hasLlmConfig,
        provider: env.LLM_BASE_URL.includes('groq') ? 'groq' : 'custom',
        model: env.LLM_MODEL,
        status: hasLlmConfig ? 'ready' : 'missing_api_key'
      }
    }
  });
});
