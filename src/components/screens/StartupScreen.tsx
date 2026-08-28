import React from 'react';
import { Trophy, Database, Play, Sparkles, Shield, ArrowRight } from 'lucide-react';

interface StartupScreenProps {
  onOpenLeague: () => void;
  onCreateNewLeague: () => void;
  onLoadDemo: () => void;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({
  onOpenLeague,
  onCreateNewLeague,
  onLoadDemo
}) => {
  return (
    <div className="min-h-full flex items-center justify-center p-8 bg-slate-100">
      <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Emblem */}
        <div className="relative inline-block">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-4xl shadow-lg border-2 border-blue-400">
            ⛳
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full shadow-md border border-amber-300">
            <Trophy className="w-4 h-4" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Pairs Golf League
          </h1>
          <p className="text-sm text-blue-600 font-semibold tracking-wide uppercase">
            Windows League Management Operating System
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed pt-1">
            Authoritative pairs scoring engine, automated quota tracking, weekly net calculations, and Week 15 quota-locked championship playoffs.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
          <button
            onClick={onOpenLeague}
            className="p-5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500 shadow-sm transition group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Play className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Open 2026 Championship</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Load active league with 10 teams, completed fixtures, and Week 8 matches in progress.
              </p>
            </div>
          </button>

          <button
            onClick={onLoadDemo}
            className="p-5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-500 shadow-sm transition group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Reset / Re-Seed Database</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Regenerate a clean 10-team, 20-player league with fresh 15-week round-robin schedule.
              </p>
            </div>
          </button>
        </div>

        {/* System Specs */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>SQLite v3.45 Local Database</span>
          </span>
          <span className="flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Offline-First Desktop Mode</span>
          </span>
        </div>
      </div>
    </div>
  );
};
