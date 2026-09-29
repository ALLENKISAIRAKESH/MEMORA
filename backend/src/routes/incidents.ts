import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db/supabase.js';
import { agentService } from '../services/agent.service.js';
import { hindsight } from '../services/hindsight.service.js';
import { validateBody } from '../middleware/validate.js';
import { Severity, EvidenceType } from '../types/index.js';

export const incidentsRouter = Router();

const createIncidentSchema = z.object({
  incident_key: z.string().min(3).optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  service: z.string().min(2, 'Service name is required'),
  severity: z.enum(['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'] as const),
  description: z.string().optional().nullable(),
  detected_at: z.string().datetime().optional()
});

const updateIncidentSchema = z.object({
  title: z.string().min(3).optional(),
  service: z.string().min(2).optional(),
  severity: z.enum(['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'] as const).optional(),
  status: z.enum(['open', 'investigating', 'resolved'] as const).optional(),
  description: z.string().optional().nullable(),
  resolved_at: z.string().datetime().optional().nullable()
});

const addEvidenceSchema = z.object({
  type: z.enum(['metric', 'log', 'deployment', 'observation', 'alert'] as const),
  name: z.string().min(1, 'Evidence name is required'),
  value: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional()
});

const createInvestigationStepSchema = z.object({
  step_number: z.number().int().positive().optional(),
  hypothesis: z.string().optional().nullable(),
  action: z.string().min(1, 'Action description is required'),
  observation: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'confirmed', 'ruled_out'] as const).default('pending')
});

const resolveIncidentSchema = z.object({
  root_cause: z.string().min(3, 'Root cause is required'),
  resolution_summary: z.string().min(5, 'Resolution summary is required'),
  runbook_id: z.string().uuid().optional().nullable(),
  resolution_time_minutes: z.number().int().positive().optional().nullable(),
  verified: z.boolean().default(true),
  failed_approaches: z.array(z.string()).default([]),
  successful_approaches: z.array(z.string()).default([]),
  lessons_learned: z.string().optional().nullable()
});

// GET /api/incidents - List all incidents
incidentsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const incidents = await db.getIncidents();
    res.json(incidents);
  } catch (error) {
    next(error);
  }
});

// POST /api/incidents - Create a new incident
incidentsRouter.post(
  '/',
  validateBody(createIncidentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { incident_key, title, service, severity, description, detected_at } = req.body;
      const key = incident_key || `INC-${Math.floor(1000 + Math.random() * 9000)}`;

      const incident = await db.createIncident({
        incident_key: key,
        title,
        service,
        severity: severity as Severity,
        status: 'open',
        description: description || null,
        detected_at: detected_at || new Date().toISOString(),
        resolved_at: null
      });

      res.status(201).json(incident);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/incidents/:id - Get incident details with evidence, investigation, and resolution
incidentsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incident = await db.getIncidentById(id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const [evidence, investigation, resolution] = await Promise.all([
      db.getEvidenceByIncidentId(incident.id),
      db.getInvestigationByIncidentId(incident.id),
      db.getResolutionByIncidentId(incident.id)
    ]);

    let investigationSteps: any[] = [];
    if (investigation) {
      investigationSteps = await db.getInvestigationSteps(investigation.id);
    }

    res.json({
      ...incident,
      evidence,
      investigation: investigation ? { ...investigation, steps: investigationSteps } : null,
      resolution
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/incidents/:id - Update incident
incidentsRouter.patch(
  '/:id',
  validateBody(updateIncidentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const incident = await db.getIncidentById(id);
      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      const updated = await db.updateIncident(incident.id, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/incidents/:id/evidence - Get evidence for an incident
incidentsRouter.get('/:id/evidence', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incident = await db.getIncidentById(id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const evidence = await db.getEvidenceByIncidentId(incident.id);
    res.json(evidence);
  } catch (error) {
    next(error);
  }
});

// POST /api/incidents/:id/evidence - Add evidence to an incident
incidentsRouter.post(
  '/:id/evidence',
  validateBody(addEvidenceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const incident = await db.getIncidentById(id);
      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      const { type, name, value, source, metadata } = req.body;
      const evidence = await db.addEvidence({
        incident_id: incident.id,
        type: type as EvidenceType,
        name,
        value: value || null,
        source: source || 'operator',
        metadata: metadata || {}
      });

      res.status(201).json(evidence);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/incidents/:id/evidence/:evidenceId - Remove evidence
incidentsRouter.delete('/:id/evidence/:evidenceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { evidenceId } = req.params;
    const deleted = await db.deleteEvidence(evidenceId);
    if (!deleted) {
      res.status(404).json({ error: 'Evidence not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/incidents/:id/investigation - Get active investigation
incidentsRouter.get('/:id/investigation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incident = await db.getIncidentById(id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const investigation = await db.getInvestigationByIncidentId(incident.id);
    if (!investigation) {
      res.json(null);
      return;
    }

    const steps = await db.getInvestigationSteps(investigation.id);
    res.json({ ...investigation, steps });
  } catch (error) {
    next(error);
  }
});

// POST /api/incidents/:id/investigation/steps - Add investigation step
incidentsRouter.post(
  '/:id/investigation/steps',
  validateBody(createInvestigationStepSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const incident = await db.getIncidentById(id);
      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      let investigation = await db.getInvestigationByIncidentId(incident.id);
      if (!investigation) {
        investigation = await db.createInvestigation(incident.id, `Investigation for ${incident.incident_key}`);
      }

      const existingSteps = await db.getInvestigationSteps(investigation.id);
      const nextStepNum = req.body.step_number || existingSteps.length + 1;

      const step = await db.addInvestigationStep({
        investigation_id: investigation.id,
        step_number: nextStepNum,
        hypothesis: req.body.hypothesis || null,
        action: req.body.action,
        observation: req.body.observation || null,
        result: req.body.result || null,
        status: req.body.status || 'pending'
      });

      res.status(201).json(step);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/incidents/:id/investigate - Trigger agent investigation loop
incidentsRouter.post('/:id/investigate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incident = await db.getIncidentById(id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const result = await agentService.investigateIncident(incident.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/incidents/:id/resolution - Get incident resolution
incidentsRouter.get('/:id/resolution', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incident = await db.getIncidentById(id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const resolution = await db.getResolutionByIncidentId(incident.id);
    res.json(resolution);
  } catch (error) {
    next(error);
  }
});

// POST /api/incidents/:id/resolve - Resolve incident and retain experience in Hindsight
incidentsRouter.post(
  '/:id/resolve',
  validateBody(resolveIncidentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const incident = await db.getIncidentById(id);
      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      const {
        root_cause,
        resolution_summary,
        runbook_id,
        resolution_time_minutes,
        verified,
        failed_approaches,
        successful_approaches,
        lessons_learned
      } = req.body;

      // 1. Store application-level resolution in Supabase/PostgreSQL
      const resolution = await db.saveResolution({
        incident_id: incident.id,
        root_cause,
        resolution_summary,
        runbook_id: runbook_id || null,
        resolution_time_minutes: resolution_time_minutes || 15,
        verified: verified !== undefined ? verified : true,
        failed_approaches: failed_approaches || [],
        successful_approaches: successful_approaches || [],
        lessons_learned: lessons_learned || null
      });

      // 2. Mark incident status as resolved
      const now = new Date().toISOString();
      await db.updateIncident(incident.id, {
        status: 'resolved',
        resolved_at: now
      });

      // 3. Extract and validate reusable operational experience for Hindsight
      const evidence = await db.getEvidenceByIncidentId(incident.id);
      const investigation = await db.getInvestigationByIncidentId(incident.id);
      const steps = investigation ? await db.getInvestigationSteps(investigation.id) : [];
      const runbook = runbook_id ? await db.getRunbookById(runbook_id) : null;

      const experienceToRetain = {
        type: 'incident_experience' as const,
        service: incident.service,
        incident_key: incident.incident_key,
        symptoms: [incident.title, ...(incident.description ? [incident.description] : [])],
        important_evidence: evidence.map((e) => `${e.name}: ${e.value} (${e.type})`),
        root_cause,
        investigation_path: steps.map((s) => s.action || s.observation || '').filter(Boolean),
        failed_approaches: failed_approaches || [],
        successful_approaches: successful_approaches || [],
        runbook: runbook?.name,
        outcome: resolution_summary,
        lesson: lessons_learned || 'Review telemetry and connection pool utilization before service mutation.'
      };

      // 4. Retain in Hindsight if configured
      let hindsightRetained = false;
      let hindsightError: string | null = null;

      if (hindsight.isConfigured()) {
        try {
          await hindsight.retainExperience(experienceToRetain);
          hindsightRetained = true;
          console.log(`[Hindsight] Retained experience for incident ${incident.incident_key}`);
        } catch (err: any) {
          console.error(`[Hindsight] Failed to retain memory:`, err.message);
          hindsightError = err.message;
        }
      }

      res.status(201).json({
        resolution,
        status: 'resolved',
        resolved_at: now,
        hindsight_retained: hindsightRetained,
        ...(hindsightError && { hindsight_error: hindsightError })
      });
    } catch (error) {
      next(error);
    }
  }
);
