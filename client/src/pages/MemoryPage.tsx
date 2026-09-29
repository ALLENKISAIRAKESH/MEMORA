import React, { useEffect, useState } from 'react';
import { 
  Brain, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  BookOpen, 
  RefreshCw
} from 'lucide-react';
import { fetchHealth } from '../services/api';
import type { SystemHealth } from '../types';

interface MemoryItem {
  id: string;
  source_incident_key?: string;
  service: string;
  symptoms: string[];
  important_evidence: string[];
  root_cause: string;
  failed_approaches: string[];
  successful_approaches: string[];
  runbook?: string;
  outcome: string;
  lesson: string;
}

export const MemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const loadMemories = () => {
    setLoading(true);
    fetchHealth()
      .then(setHealth)
      .catch(() => {});

    // Query backend memory store / Hindsight memories
    fetch('/api/memory/list')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load memories');
        return res.json();
      })
      .then((data) => setMemories(data))
      .catch((err) => {
        console.warn('Memory list fetch fallback:', err);
        // Default seeded knowledge view if endpoint not yet called
        setMemories([
          {
            id: 'mem-1001',
            source_incident_key: 'INC-1001',
            service: 'payment-api',
            symptoms: ['high API latency', 'request timeouts', 'high DB connection utilization'],
            important_evidence: ['DB connection utilization reached 99%'],
            root_cause: 'Database connection pool exhaustion',
            failed_approaches: ['Restart API', 'Increase request timeout'],
            successful_approaches: ['Increase DB connection pool from 50 to 100'],
            runbook: 'DB-CONNECTION-POOL-03',
            outcome: 'Latency returned to normal within 14 minutes',
            lesson: 'When similar symptoms occur with high DB connection utilization, inspect the pool first before restarting.'
          },
          {
            id: 'mem-1002',
            source_incident_key: 'INC-1002',
            service: 'checkout-api',
            symptoms: ['Checkout requests intermittently timed out', 'upstream gateway 504'],
            important_evidence: ['Payment gateway timeout spikes'],
            root_cause: 'Upstream payment gateway timeout during seasonal traffic burst',
            failed_approaches: ['Pod restart', 'Clearing local cache'],
            successful_approaches: ['Enabled circuit breaker fallback mode'],
            runbook: 'CIRCUIT-BREAKER-01',
            outcome: 'Intermittent timeouts mitigated via graceful degradation',
            lesson: 'Always verify downstream partner latency before mutating local deployment instances.'
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const filteredMemories = memories.filter((m) => {
    const q = query.toLowerCase();
    return (
      m.service.toLowerCase().includes(q) ||
      m.root_cause.toLowerCase().includes(q) ||
      m.lesson.toLowerCase().includes(q) ||
      m.symptoms.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            <span>Hindsight Operational Memory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/80 font-mono font-bold">
              BANK: {health?.components.hindsight.bank_id || 'memora-ops'}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Persistent incident experience retained across post-mortems and operational lifecycles.
          </p>
        </div>

        <button
          onClick={loadMemories}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Bank</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter memories by service, symptom, root cause, or lesson..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
        />
      </div>

      {/* Memory cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.map((mem) => (
          <div
            key={mem.id}
            className="p-5 rounded-xl bg-slate-900/90 border border-purple-900/40 glow-memory space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                    {mem.source_incident_key || 'EXPERIENCE'}
                  </span>
                  <span className="text-xs font-mono text-slate-300">{mem.service}</span>
                </div>
                {mem.runbook && (
                  <span className="text-[11px] font-mono text-purple-300 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{mem.runbook}</span>
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                  Root Cause:
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {mem.root_cause}
                </h3>
              </div>

              {/* Symptoms */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Symptoms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {mem.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Approaches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold font-mono text-[11px]">
                    <ThumbsUp className="w-3 h-3" />
                    <span>Successful Fix:</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    {mem.successful_approaches[0] || 'Confirmed fix recorded'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-1">
                  <div className="flex items-center gap-1 text-rose-400 font-semibold font-mono text-[11px]">
                    <ThumbsDown className="w-3 h-3" />
                    <span>Ruled Out (Avoid Waste):</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {mem.failed_approaches[0] || 'None documented'}
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson */}
            <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/50 text-xs text-purple-200 italic">
              "{mem.lesson}"
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
