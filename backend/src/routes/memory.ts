import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { hindsight, HindsightConfigurationError } from '../services/hindsight.service.js';
import { validateBody } from '../middleware/validate.js';
import { db } from '../db/supabase.js';

export const memoryRouter = Router();

const retainMemorySchema = z.object({
  type: z.literal('incident_experience').default('incident_experience'),
  service: z.string().min(1, 'Service name is required'),
  incident_key: z.string().optional(),
  symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
  important_evidence: z.array(z.string()).default([]),
  root_cause: z.string().min(3, 'Root cause is required'),
  investigation_path: z.array(z.string()).default([]),
  failed_approaches: z.array(z.string()).default([]),
  successful_approaches: z.array(z.string()).default([]),
  runbook: z.string().optional(),
  outcome: z.string().default('Resolved'),
  lesson: z.string().min(5, 'Generalizable lesson is required')
});

const recallMemorySchema = z.object({
  service: z.string().min(1, 'Service is required'),
  symptoms: z.array(z.string()).default([]),
  current_evidence: z.array(z.string()).default([])
});

// POST /api/memory/retain - Store reusable incident experience in Hindsight
memoryRouter.post(
  '/retain',
  validateBody(retainMemorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await hindsight.retainExperience(req.body);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof HindsightConfigurationError) {
        res.status(503).json({
          error: error.message,
          code: 'HINDSIGHT_NOT_CONFIGURED',
          hint: 'Add HINDSIGHT_API_KEY to your .env file to enable persistent cloud memory.'
        });
        return;
      }
      next(error);
    }
  }
);

// POST /api/memory/recall - Recall relevant operational experiences
memoryRouter.post(
  '/recall',
  validateBody(recallMemorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await hindsight.recallExperiences(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/memory/list - List memories from Hindsight (or local database fallback if unconfigured)
memoryRouter.get('/list', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (hindsight.isConfigured()) {
      const list = await hindsight.listMemories();
      res.json(list.items);
      return;
    }

    // If Hindsight API key is not configured, show experiences derived from resolved incidents in the database
    const incidents = await db.getIncidents();
    const resolved = incidents.filter((i) => i.status === 'resolved');
    const items = await Promise.all(
      resolved.map(async (inc) => {
        const resolution = await db.getResolutionByIncidentId(inc.id);
        const evidence = await db.getEvidenceByIncidentId(inc.id);
        const runbook = resolution?.runbook_id
          ? await db.getRunbookById(resolution.runbook_id)
          : null;

        return {
          id: `mem-${inc.incident_key}`,
          source_incident_key: inc.incident_key,
          service: inc.service,
          symptoms: [inc.title, inc.description].filter(Boolean) as string[],
          important_evidence: evidence.map((e) => `${e.name}: ${e.value}`),
          root_cause: resolution?.root_cause || 'Root cause identified',
          failed_approaches: resolution?.failed_approaches || [],
          successful_approaches: resolution?.successful_approaches || [],
          runbook: runbook?.name,
          outcome: resolution?.resolution_summary || 'Resolved',
          lesson: resolution?.lessons_learned || 'Documented in post-mortem'
        };
      })
    );

    res.json(items);
  } catch (error) {
    next(error);
  }
});
