import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db/supabase.js';
import { validateBody } from '../middleware/validate.js';

export const runbooksRouter = Router();

const createRunbookSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  service: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  steps: z.array(
    z.object({
      step: z.number(),
      action: z.string().min(1)
    })
  ).default([]),
  version: z.string().default('1.0')
});

// GET /api/runbooks
runbooksRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const runbooks = await db.getRunbooks();
    res.json(runbooks);
  } catch (error) {
    next(error);
  }
});

// GET /api/runbooks/:id
runbooksRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let runbook = await db.getRunbookById(id);
    if (!runbook) {
      runbook = await db.getRunbookByNameOrService(id);
    }
    if (!runbook) {
      res.status(404).json({ error: 'Runbook not found' });
      return;
    }
    res.json(runbook);
  } catch (error) {
    next(error);
  }
});

// POST /api/runbooks
runbooksRouter.post(
  '/',
  validateBody(createRunbookSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, service, description, steps, version } = req.body;
      const created = await db.createRunbook({
        name,
        service: service || null,
        description: description || null,
        steps,
        version: version || '1.0'
      });
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }
);
