import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Brain, 
  ArrowRight, 
  Server, 
  ShieldAlert, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { fetchIncidents } from '../services/api';
import type { Incident } from '../types';

export const Dashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents()
      .then(setIncidents)
      .catch((err) => console.error('Failed to load incidents:', err))
      .finally(() => setLoading(false));
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const criticalIncidents = incidents.filter((i) => (i.severity === 'SEV-1' || i.severity === 'SEV-2') && i.status !== 'resolved');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Hero / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Operational Command &amp; Memory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
              LIVE
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time incident response powered by Hindsight persistent operational memory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/incidents?new=true"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-950"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulate Incident</span>
          </Link>
          <Link
            to="/memory"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 font-medium text-sm transition-all"
          >
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Inspect Memory</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Incidents */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Active</span>
            <AlertTriangle className={`w-4 h-4 ${activeIncidents.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white font-mono">{activeIncidents.length}</span>
            <span className="text-xs text-slate-400 ml-2">requiring action</span>
          </div>
        </div>

        {/* Critical */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Critical SEV-1/2</span>
            <ShieldAlert className={`w-4 h-4 ${criticalIncidents.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-rose-400 font-mono">{criticalIncidents.length}</span>
            <span className="text-xs text-slate-400 ml-2">unresolved</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-emerald-400 font-mono">{resolvedIncidents.length}</span>
            <span className="text-xs text-slate-400 ml-2">post-mortemed</span>
          </div>
        </div>

        {/* Hindsight Experiences */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-900/40 glow-memory flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-300">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Retained Memories</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-purple-300 font-mono">3+</span>
            <span className="text-xs text-purple-400 ml-2">in Hindsight bank</span>
          </div>
        </div>

        {/* MTTR */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Avg Resolution</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-cyan-400 font-mono">16.6m</span>
            <span className="text-xs text-slate-400 ml-2">MTTR</span>
          </div>
        </div>
      </div>

      {/* Main split: Recent Incidents & Memory Loop Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Incidents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              <span>Recent Production Incidents</span>
            </h2>
            <Link to="/incidents" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono">
              View all ({incidents.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-slate-400 font-mono text-sm animate-pulse">
                Loading incidents from database...
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No incidents recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {incidents.slice(0, 5).map((inc) => {
                  const isSev1 = inc.severity === 'SEV-1';
                  const isResolved = inc.status === 'resolved';

                  return (
                    <Link
                      key={inc.id}
                      to={`/incidents/${inc.id}`}
                      className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            isSev1 ? 'bg-rose-950 text-rose-300 border border-rose-800/80' : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                          }`}>
                            {inc.severity}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs text-slate-400 font-semibold group-hover:text-emerald-400 transition-colors">
                              {inc.incident_key}
                            </span>
                            <span className="text-sm font-medium text-white group-hover:underline">
                              {inc.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400 font-mono">
                            <span className="text-slate-300">{inc.service}</span>
                            <span>•</span>
                            <span>{new Date(inc.detected_at).toLocaleDateString()} {new Date(inc.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono capitalize ${
                          isResolved 
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/60 animate-pulse'
                        }`}>
                          {inc.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: The Memory-Driven Loop & Learning Curve */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Memora Operational Loop</span>
          </h2>

          <div className="p-5 rounded-xl bg-slate-900/90 border border-purple-900/40 space-y-4">
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="w-5 h-5 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0">1</div>
                <div>
                  <div className="font-semibold text-white">Incident &amp; Evidence</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Metrics, logs, traces ingested into PostgreSQL.</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-950 border border-purple-900/50">
                <div className="w-5 h-5 rounded-full bg-purple-900 text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0">2</div>
                <div>
                  <div className="font-semibold text-purple-300">Hindsight Recall</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Recalls relevant past incident experiences &amp; runbooks.</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">3</div>
                <div>
                  <div className="font-semibold text-white">Reason &amp; Plan</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Separates observed facts from history, checks conflicts.</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-950 border border-purple-900/50">
                <div className="w-5 h-5 rounded-full bg-purple-900 text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0">4</div>
                <div>
                  <div className="font-semibold text-purple-300">Hindsight Retain</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Resolved experience, failed approaches, &amp; lessons retained.</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Core thesis:</span> Infrastructure that remembers. Future similar incidents don't start from zero.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
