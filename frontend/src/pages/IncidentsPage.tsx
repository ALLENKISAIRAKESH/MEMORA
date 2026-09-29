import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  ArrowRight, 
  ShieldAlert, 
  X, 
  Sparkles
} from 'lucide-react';
import { fetchIncidents, createIncident, addEvidence } from '../services/api';
import type { Incident, Severity } from '../types';

export const IncidentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New incident form state
  const [title, setTitle] = useState('');
  const [service, setService] = useState('payment-api');
  const [severity, setSeverity] = useState<Severity>('SEV-1');
  const [description, setDescription] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [initialEvidence, setInitialEvidence] = useState<{ type: string; name: string; value: string }[]>([]);
  const [creating, setCreating] = useState(false);

  const loadIncidents = () => {
    setLoading(true);
    fetchIncidents()
      .then(setIncidents)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIncidents();
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Demo presets for easy 1-click reproduction of PRD scenarios
  const applyPreset = (preset: 'scenario1' | 'scenario2' | 'scenario3') => {
    if (preset === 'scenario1') {
      setCustomKey('INC-1001-DEMO');
      setTitle('Payment API Latency Spike');
      setService('payment-api');
      setSeverity('SEV-1');
      setDescription('Payment requests exceeding 5 seconds with timeouts climbing.');
      setInitialEvidence([
        { type: 'metric', name: 'api_latency', value: '5.2s' },
        { type: 'metric', name: 'db_connections', value: '99%' },
        { type: 'log', name: 'payment-api', value: 'connection pool exhausted' },
      ]);
    } else if (preset === 'scenario2') {
      setCustomKey('INC-1007');
      setTitle('Payment API Latency Recurring');
      setService('payment-api');
      setSeverity('SEV-1');
      setDescription('API latency reaching 4.8s with timeouts climbing to 31%.');
      setInitialEvidence([
        { type: 'metric', name: 'api_latency', value: '4.8s' },
        { type: 'metric', name: 'db_connections', value: '97%' },
        { type: 'metric', name: 'timeouts', value: '31%' },
      ]);
    } else if (preset === 'scenario3') {
      setCustomKey('INC-1008');
      setTitle('Payment API Latency (Cache Divergence)');
      setService('payment-api');
      setSeverity('SEV-2');
      setDescription('API latency high, but DB connection pool is healthy. Redis memory is critical.');
      setInitialEvidence([
        { type: 'metric', name: 'api_latency', value: '4.8s' },
        { type: 'metric', name: 'db_connections', value: '34%' },
        { type: 'metric', name: 'redis_memory', value: '96%' },
      ]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !service) return;

    try {
      setCreating(true);
      const inc = await createIncident({
        title,
        service,
        severity,
        description,
        incident_key: customKey || undefined,
      });

      // Attach initial evidence if present
      for (const ev of initialEvidence) {
        await addEvidence(inc.id, ev);
      }

      setIsModalOpen(false);
      setSearchParams({});
      // Reset form
      setTitle('');
      setDescription('');
      setCustomKey('');
      setInitialEvidence([]);
      loadIncidents();
    } catch (err: any) {
      alert(`Error creating incident: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch = 
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.service.toLowerCase().includes(search.toLowerCase()) ||
      inc.incident_key.toLowerCase().includes(search.toLowerCase());
    const matchesSev = selectedSeverity === 'ALL' || inc.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || inc.status === selectedStatus;
    return matchesSearch && matchesSev && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Incidents Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {incidents.length} Total
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track, investigate, and review production outages and service degradations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>New Incident</span>
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search key, service, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="ALL">All Severities</option>
            <option value="SEV-1">SEV-1 Critical</option>
            <option value="SEV-2">SEV-2 Major</option>
            <option value="SEV-3">SEV-3 Moderate</option>
            <option value="SEV-4">SEV-4 Minor</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-mono text-sm animate-pulse">
            Loading incidents...
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No incidents match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 font-mono text-xs uppercase text-slate-400">
                  <th className="py-3 px-4">Key</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detected</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-emerald-400">
                      {inc.incident_key}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                      {inc.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-300">
                      {inc.service}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        inc.severity === 'SEV-1' 
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/80' 
                          : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono capitalize ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">
                      {new Date(inc.detected_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 group-hover:translate-x-0.5 transition-transform font-mono"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Create New Incident</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets for Demo Scenarios */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Demo Scenario Quick Presets</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('scenario1')}
                  className="px-2.5 py-1.5 text-left rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-colors"
                >
                  <div className="font-bold text-emerald-400">Scenario 1</div>
                  <div className="text-[10px] text-slate-400 truncate">INC-1001 (Learn)</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('scenario2')}
                  className="px-2.5 py-1.5 text-left rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-colors"
                >
                  <div className="font-bold text-purple-400">Scenario 2</div>
                  <div className="text-[10px] text-slate-400 truncate">INC-1007 (Recall)</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('scenario3')}
                  className="px-2.5 py-1.5 text-left rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-colors"
                >
                  <div className="font-bold text-cyan-400">Scenario 3</div>
                  <div className="text-[10px] text-slate-400 truncate">INC-1008 (Diverge)</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Key (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. INC-1007"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Service</label>
                  <input
                    type="text"
                    required
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payment API latency exceeded 4s"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Severity)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="SEV-1">SEV-1 Critical</option>
                    <option value="SEV-2">SEV-2 Major</option>
                    <option value="SEV-3">SEV-3 Moderate</option>
                    <option value="SEV-4">SEV-4 Minor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe initial symptoms and blast radius..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none text-xs"
                />
              </div>

              {initialEvidence.length > 0 && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
                  <div className="text-slate-400 font-semibold mb-1">Attached Initial Evidence:</div>
                  {initialEvidence.map((ev, i) => (
                    <div key={i} className="text-emerald-400">
                      [{ev.type}] {ev.name}: <span className="text-slate-200">{ev.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
