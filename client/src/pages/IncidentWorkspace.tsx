import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Brain, 
  Activity, 
  Plus, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles,
  RefreshCw,
  FileText,
  Lightbulb,
  ThumbsDown,
  ThumbsUp,
  Cpu
} from 'lucide-react';
import { fetchIncident, addEvidence } from '../services/api';
import type { Incident, IncidentEvidence } from '../types';

export const IncidentWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<(Incident & {
    evidence: IncidentEvidence[];
    investigation: any;
    resolution: any;
  }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Evidence submission modal / form
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evType, setEvType] = useState('metric');
  const [evName, setEvName] = useState('');
  const [evValue, setEvValue] = useState('');
  const [evSource] = useState('synthetic-monitoring');
  const [addingEvidence, setAddingEvidence] = useState(false);

  // Agent Investigation State
  const [investigating, setInvestigating] = useState(false);
  const [investigationData, setInvestigationData] = useState<any>(null);

  // Resolution Form State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [rootCause, setRootCause] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [failedApproaches, setFailedApproaches] = useState('');
  const [successfulApproaches, setSuccessfulApproaches] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    fetchIncident(id)
      .then((data) => {
        setIncident(data);
        if (data.investigation) {
          setInvestigationData(data.investigation);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !evName) return;

    try {
      setAddingEvidence(true);
      await addEvidence(incident.id, {
        type: evType,
        name: evName,
        value: evValue,
        source: evSource
      });
      setIsEvidenceModalOpen(false);
      setEvName('');
      setEvValue('');
      loadData();
    } catch (err: any) {
      alert(`Error adding evidence: ${err.message}`);
    } finally {
      setAddingEvidence(false);
    }
  };

  // Trigger AI Agent Investigation
  const handleTriggerInvestigation = async () => {
    if (!incident) return;
    try {
      setInvestigating(true);
      const res = await fetch(`/api/incidents/${incident.id}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Investigation failed: ${res.statusText}`);
      }
      const data = await res.json();
      setInvestigationData(data);
      loadData();
    } catch (err: any) {
      alert(`Investigation agent error: ${err.message}`);
    } finally {
      setInvestigating(false);
    }
  };

  // Submit Resolution and Retain to Hindsight
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !rootCause || !resolutionSummary) return;

    try {
      setResolving(true);
      const res = await fetch(`/api/incidents/${incident.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          root_cause: rootCause,
          resolution_summary: resolutionSummary,
          failed_approaches: failedApproaches ? failedApproaches.split('\n').filter(Boolean) : [],
          successful_approaches: successfulApproaches ? successfulApproaches.split('\n').filter(Boolean) : [],
          lessons_learned: lessonsLearned,
          resolution_time_minutes: 15,
          verified: true
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Resolution failed: ${res.statusText}`);
      }

      setIsResolveModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Resolution error: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 font-mono text-sm animate-pulse">
        Loading incident workspace...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-rose-400 font-semibold">Incident not found</div>
        <Link to="/incidents" className="text-emerald-400 font-mono text-sm hover:underline">
          Return to Incidents list
        </Link>
      </div>
    );
  }

  const isResolved = incident.status === 'resolved';

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start space-x-3">
          <Link
            to="/incidents"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-emerald-400">
                {incident.incident_key}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                incident.severity === 'SEV-1' 
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/80' 
                  : 'bg-amber-950 text-amber-300 border border-amber-800/80'
              }`}>
                {incident.severity}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono capitalize ${
                isResolved 
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' 
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/60 animate-pulse'
              }`}>
                {incident.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              {incident.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Service: <span className="text-slate-200">{incident.service}</span> • Detected: {new Date(incident.detected_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEvidenceModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Evidence</span>
          </button>

          {!isResolved ? (
            <button
              onClick={() => setIsResolveModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve &amp; Retain</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolved</span>
            </div>
          )}
        </div>
      </div>

      {/* Three Column Layout as defined in PRD & UI Spec */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1: LEFT - Incident Details & Evidence (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Description & Symptoms */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-xs font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Incident Overview</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {incident.description || 'No initial description provided.'}
            </p>
          </div>

          {/* Current Evidence Stream */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Current Evidence ({incident.evidence?.length || 0})</span>
              </h2>
              <button
                onClick={() => setIsEvidenceModalOpen(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono"
              >
                + Add
              </button>
            </div>

            {(!incident.evidence || incident.evidence.length === 0) ? (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-500 font-mono text-center">
                No evidence attached yet. Add metrics or logs.
              </div>
            ) : (
              <div className="space-y-2">
                {incident.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                        {ev.type}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {ev.source || 'telemetry'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-slate-300 font-semibold">{ev.name}:</span>
                      <span className="text-emerald-400 font-bold text-sm">{ev.value || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: CENTER - Agent Reasoning, Hypotheses & Plan (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-mono uppercase font-bold text-white">
                  Incident Investigation Agent
                </h2>
              </div>
              <button
                onClick={handleTriggerInvestigation}
                disabled={investigating}
                className="flex items-center space-x-1.5 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-medium transition-colors disabled:opacity-50"
              >
                {investigating ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Run Investigation</span>
                  </>
                )}
              </button>
            </div>

            {/* Investigation content */}
            {investigating ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                <div className="text-xs font-mono text-purple-300 font-semibold">
                  Recalling Hindsight memories &amp; comparing evidence...
                </div>
                <div className="text-[11px] text-slate-500">
                  Distinguishing OBSERVED vs HISTORICAL facts
                </div>
              </div>
            ) : investigationData ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-3 rounded-lg bg-slate-950 border border-purple-900/40 text-xs text-slate-300">
                  <div className="text-[11px] font-mono font-bold text-purple-300 mb-1">
                    AGENT ASSESSMENT:
                  </div>
                  {investigationData.summary || 'Investigation initialized.'}
                </div>

                {/* Hypotheses */}
                {investigationData.hypotheses && investigationData.hypotheses.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-mono uppercase text-slate-400 font-semibold">
                      Ranked Hypotheses
                    </div>
                    {investigationData.hypotheses.map((h: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{h.title}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            h.label === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            h.label === 'HISTORICAL' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                            h.label === 'RULED_OUT' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {h.label}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{h.reasoning}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prioritized Next Steps */}
                {investigationData.next_steps && investigationData.next_steps.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-mono uppercase text-slate-400 font-semibold">
                      Prioritized Next Steps
                    </div>
                    {investigationData.next_steps.map((step: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      >
                        <span className="w-4 h-4 rounded-full bg-emerald-900 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-200">{step.action}</div>
                          {step.rationale && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{step.rationale}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
                <Lightbulb className="w-8 h-8 text-purple-400 mx-auto opacity-70" />
                <div className="text-xs text-slate-400">
                  Ready to investigate this incident with historical memory.
                </div>
                <button
                  onClick={handleTriggerInvestigation}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-medium transition-colors"
                >
                  Run Agent Investigation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: RIGHT - Hindsight Memory & Relevance (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-4 rounded-xl bg-slate-900 border border-purple-900/50 glow-memory space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-mono uppercase font-bold text-purple-300">
                  Hindsight Memory Engine
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
                RECALL
              </span>
            </div>

            {/* Recalled Memory Cards */}
            {investigationData?.recalled_memories && investigationData.recalled_memories.length > 0 ? (
              <div className="space-y-3">
                {investigationData.recalled_memories.map((mem: any, i: number) => {
                  const isDivergent = mem.relevance === 'divergent';

                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl bg-slate-950 border text-xs space-y-2.5 transition-all ${
                        isDivergent 
                          ? 'border-amber-700/60 bg-amber-950/10' 
                          : 'border-purple-800/80 bg-purple-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-purple-300">
                          {mem.source_incident_key || 'Historical Match'}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          isDivergent
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {mem.relevance} relevance
                        </span>
                      </div>

                      {/* Why it matters */}
                      <div className="text-[11px] text-slate-300">
                        <strong className="text-white">Why it matters: </strong>
                        {mem.why_it_matters}
                      </div>

                      {/* Similarities & Differences */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-slate-800/80">
                        <div>
                          <span className="text-emerald-400 font-semibold">Similarities:</span>
                          <ul className="list-disc list-inside text-slate-400 mt-0.5">
                            {mem.similarities?.map((s: string, idx: number) => (
                              <li key={idx} className="truncate">{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-amber-400 font-semibold">Differences:</span>
                          <ul className="list-disc list-inside text-slate-400 mt-0.5">
                            {mem.differences?.map((d: string, idx: number) => (
                              <li key={idx} className="truncate">{d}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Previous Successful Approaches */}
                      {mem.previous_successful_approaches && mem.previous_successful_approaches.length > 0 && (
                        <div className="p-2 rounded bg-emerald-950/40 border border-emerald-900/50 text-[11px] space-y-1">
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            <span>Previous Successful Fix:</span>
                          </span>
                          <div className="text-slate-300">{mem.previous_successful_approaches[0]}</div>
                        </div>
                      )}

                      {/* Previous Failed Approaches */}
                      {mem.previous_failed_approaches && mem.previous_failed_approaches.length > 0 && (
                        <div className="p-2 rounded bg-rose-950/30 border border-rose-900/50 text-[11px] space-y-1">
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" />
                            <span>Avoided Waste (Failed Previously):</span>
                          </span>
                          <div className="text-slate-400">{mem.previous_failed_approaches[0]}</div>
                        </div>
                      )}

                      {/* Relevant Lesson */}
                      {mem.relevant_lesson && (
                        <div className="text-[11px] text-purple-300/90 italic pt-1 border-t border-slate-800">
                          "{mem.relevant_lesson}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 font-mono space-y-2">
                <div>No recalled memories yet.</div>
                <div className="text-[11px] text-slate-600">
                  Run agent investigation to trigger Hindsight semantic recall.
                </div>
              </div>
            )}
          </div>

          {/* Retained Resolution Card (if already resolved) */}
          {incident.resolution && (
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resolved &amp; Retained in Memory</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  MTTR: {incident.resolution.resolution_time_minutes}m
                </span>
              </div>
              <div className="text-xs space-y-2">
                <div>
                  <strong className="text-slate-200">Root Cause: </strong>
                  <span className="text-slate-400">{incident.resolution.root_cause}</span>
                </div>
                <div>
                  <strong className="text-slate-200">Resolution: </strong>
                  <span className="text-slate-400">{incident.resolution.resolution_summary}</span>
                </div>
                {incident.resolution.lessons_learned && (
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-emerald-300">
                    "{incident.resolution.lessons_learned}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Evidence Modal */}
      {isEvidenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Attach Evidence</h3>
            <form onSubmit={handleAddEvidence} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Evidence Type</label>
                <select
                  value={evType}
                  onChange={(e) => setEvType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="metric">Metric</option>
                  <option value="log">Log</option>
                  <option value="deployment">Deployment</option>
                  <option value="observation">Observation</option>
                  <option value="alert">Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Metric / Property Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. db_connections, api_latency"
                  value={evName}
                  onChange={(e) => setEvName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Value / Observation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 98%, 4.9s, connection pool exhausted"
                  value={evValue}
                  onChange={(e) => setEvValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingEvidence}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-mono font-medium disabled:opacity-50"
                >
                  {addingEvidence ? 'Saving...' : 'Add Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve and Retain Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Resolve Incident &amp; Retain in Hindsight</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Records post-mortem facts and retains structured reusable operational memory for future incidents.
              </p>
            </div>

            <form onSubmit={handleResolve} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Confirmed Root Cause</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database connection pool exhaustion"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Resolution Summary</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Scaled connection pool max from 50 to 100, verified recovery."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Failed Approaches (one per line)</label>
                <textarea
                  rows={2}
                  placeholder="Restarting API didn't help&#10;Increasing HTTP timeout"
                  value={failedApproaches}
                  onChange={(e) => setFailedApproaches(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Successful Approaches (one per line)</label>
                <textarea
                  rows={2}
                  placeholder="Inspected DB pool metrics&#10;Increased pool capacity"
                  value={successfulApproaches}
                  onChange={(e) => setSuccessfulApproaches(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Generalizable Lesson</label>
                <input
                  type="text"
                  placeholder="When latency coincides with high DB connections, check pool before restart."
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium disabled:opacity-50"
                >
                  {resolving ? 'Retaining to Hindsight...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
