import express from 'express';
import cors from 'cors';
import { env, hasSupabaseConfig, hasHindsightConfig, hasLlmConfig } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { incidentsRouter } from './routes/incidents.js';
import { runbooksRouter } from './routes/runbooks.js';
import { memoryRouter } from './routes/memory.js';
import { errorHandler } from './middleware/errorHandler.js';

import path from 'path';
import fs from 'fs';

const app = express();

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/runbooks', runbooksRouter);
app.use('/api/memory', memoryRouter);

// API 404 Fallback
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Static frontend serving (for unified Render / single-container deployment)
const candidateDistPaths = [
  path.resolve(currentDir, '../../frontend/dist'),
  path.resolve(currentDir, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'dist')
];
const frontendDist = candidateDistPaths.find((p) => fs.existsSync(p));

if (frontendDist) {
  console.log(`[Frontend] Serving static production build from ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // 404 Fallback when frontend build is not present
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
}

// Global error handler
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`
=====================================================
  MEMORA - Infrastructure that remembers
  Incident Response Agent API
=====================================================
  Port:          ${env.PORT}
  Environment:   ${process.env.NODE_ENV || 'development'}
  Web Client:    ${env.WEB_URL}
  Supabase:      ${hasSupabaseConfig ? 'Connected' : 'Active Local (Seeded)'}
  Hindsight:     ${hasHindsightConfig ? 'Configured' : 'Awaiting HINDSIGHT_API_KEY'}
  LLM Provider:  ${hasLlmConfig ? 'Configured (' + env.LLM_MODEL + ')' : 'Awaiting LLM_API_KEY'}
=====================================================
  Health Check:  http://localhost:${env.PORT}/api/health
  Incidents:     http://localhost:${env.PORT}/api/incidents
=====================================================
  `);
});

export default app;
