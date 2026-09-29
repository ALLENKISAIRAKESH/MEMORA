import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, ShieldAlert, Database, Brain, Sparkles, Terminal } from 'lucide-react';
import { fetchHealth } from '../services/api';
import type { SystemHealth } from '../types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn('Could not fetch health:', err));
    const interval = setInterval(() => {
      fetchHealth().then(setHealth).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Activity },
    { label: 'Incidents', path: '/incidents', icon: ShieldAlert },
    { label: 'Hindsight Memory', path: '/memory', icon: Brain },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    MEMORA
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold tracking-wider">
                    SRE AGENT
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Infrastructure that remembers</p>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center space-x-1 ml-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800/80 text-emerald-400 border border-slate-700/80'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Status Badges */}
          <div className="flex items-center space-x-3">
            {/* Supabase Status */}
            <div
              title={`Supabase: ${health?.components.supabase.mode || 'Connecting...'}`}
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Postgres</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {/* Hindsight Status */}
            <div
              title={`Hindsight Memory: ${health?.components.hindsight.status || 'Checking...'}`}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-900 border border-purple-900/50 text-purple-300"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Hindsight</span>
              <span className={`w-1.5 h-1.5 rounded-full ${health?.components.hindsight.configured ? 'bg-purple-500 animate-pulse' : 'bg-amber-400'}`}></span>
            </div>

            {/* Quick action: New incident */}
            <Link
              to="/incidents?new=true"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Report Incident</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
