import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from project root or server directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  WEB_URL: z.string().default('http://localhost:5173'),
  
  // Supabase
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  
  // Hindsight
  HINDSIGHT_API_URL: z.string().optional().default('https://api.hindsight.vectorize.io'),
  HINDSIGHT_API_KEY: z.string().optional().default(''),
  HINDSIGHT_BANK_ID: z.string().optional().default('memora-ops'),
  
  // LLM
  LLM_API_KEY: z.string().optional().default(''),
  LLM_BASE_URL: z.string().optional().default('https://api.groq.com/openai/v1'),
  LLM_MODEL: z.string().optional().default('llama-3.3-70b-versatile'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export const hasSupabaseConfig = Boolean(
  env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)
);

export const hasHindsightConfig = Boolean(
  env.HINDSIGHT_API_URL && env.HINDSIGHT_API_KEY
);

export const hasLlmConfig = Boolean(
  env.LLM_API_KEY
);
