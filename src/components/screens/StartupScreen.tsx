import React, { useState } from 'react';
import { Trophy, Database, Play, Sparkles, Shield, ArrowRight, Settings, Trash2, CheckCircle2 } from 'lucide-react';
import { DatabaseEngine } from '../../storage/db';

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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // League custom configuration
  const [societyName, setSocietyName] = useState('Championship Pairs Golf');
  const [numWeeks, setNumWeeks] = useState(15);
  const [matchesPerWeek, setMatchesPerWeek] = useState(5);
  const [autoGenTeams, setAutoGenTeams] = useState(true);

  const handleCreateCustom = () => {
    DatabaseEngine.createCustomLeague({
      societyName,
      numWeeks,
      matchesPerWeek,
      removeSeedData: true,
      autoGenerateTeams: autoGenTeams
    });
    setShowConfigModal(false);
    onOpenLeague();
  };

  const handleClearAllSeeds = () => {
    DatabaseEngine.removeAllSeedData(true);
    setShowClearModal(false);
    onOpenLeague();
  };

  return (
    <div className="min-h-full flex items-center justify-center p-8 bg-slate-100">
      <div className="max-w-2xl w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Emblem */}
        <div className="relative inline-block">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-3xl shadow-lg border-2 border-blue-400">
            ⛳
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-md border border-amber-300">
            <Trophy className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Pairs Golf League
          </h1>
          <p className="text-xs text-blue-600 font-semibold tracking-wider uppercase">
            Windows League Management Operating System
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed pt-1">
            Authoritative pairs scoring engine, dynamic schedule generator, quota tracking, weekly net calculations, and championship playoffs.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-left">
          {/* Option 1: Open Active League */}
          <button
            onClick={onOpenLeague}
            className="p-5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500 shadow-xs transition group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Play className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Open Current League</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Open active league with current standings, fixtures, teams, and score entry.
              </p>
            </div>
          </button>

          {/* Option 2: Configure Custom League (Weeks & Matches) */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500 shadow-xs transition group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Settings className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">New Custom League</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Set custom number of weeks, matches per week, and society title with fresh schedule.
              </p>
            </div>
          </button>

          {/* Option 3: Remove All Seed Data */}
          <button
            onClick={() => setShowClearModal(true)}
            className="p-5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-rose-400 shadow-xs transition group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Remove All Seed Data</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Wipe demo players, teams, and scores for a clean blank slate to enter your real roster.
              </p>
            </div>
          </button>

          {/* Option 4: Reset to Demo Seeds */}
          <button
            onClick={onLoadDemo}
            className="p-5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-500 shadow-xs transition group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Load Demo League</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                Re-seed standard 10 teams, 20 players, and 15-week round-robin fixtures.
              </p>
            </div>
          </button>
        </div>

        {/* System Specs */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>SQLite Local Database Engine</span>
          </span>
          <span className="flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Offline-First Management System</span>
          </span>
        </div>
      </div>

      {/* Custom League Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 text-left">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Configure Custom Golf League</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set custom season length and weekly matches to generate a balanced schedule.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">League / Society Name</label>
                <input
                  type="text"
                  value={societyName}
                  onChange={e => setSocietyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Pinehurst Pairs Society"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Number of Weeks</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={numWeeks}
                    onChange={e => setNumWeeks(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Regular season weeks (1–30)</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Matches Per Week</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={matchesPerWeek}
                    onChange={e => setMatchesPerWeek(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Matches per round (e.g. 5)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenTeams}
                    onChange={e => setAutoGenTeams(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Auto-generate {matchesPerWeek * 2} balanced pairs teams and rosters
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6 leading-normal">
                  If unchecked, a clean empty roster (0 teams) is prepared so you can add players manually.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustom}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
              >
                Create & Generate Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Seed Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 text-left">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Remove All Seed Data?</h3>
                <span className="text-xs text-slate-500">Wipe demo players, teams, and scores</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will completely wipe all 10 demo teams, 20 players, and scheduled demo fixtures. You will start with a fresh blank league to enter your actual golf society members.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllSeeds}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
              >
                Confirm Remove All Seed Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

