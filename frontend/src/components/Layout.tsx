import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-xs text-slate-500 text-center font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>Memora Incident Agent — Operating Loop: Incident → Evidence → Recall → Reason → Resolve → Retain</div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Powered by <strong className="text-purple-400">Hindsight</strong> &amp; <strong className="text-emerald-400">Supabase</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
};
