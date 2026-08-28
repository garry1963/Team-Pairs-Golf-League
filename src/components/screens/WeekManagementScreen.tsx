import React, { useState } from 'react';
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, Lock,
  Play, ArrowRight, ShieldAlert, Sparkles, RefreshCw, Trophy
} from 'lucide-react';
import { Season, Fixture, StandingsRow, Team } from '../../types';
import { DatabaseEngine } from '../../storage/db';

interface WeekManagementScreenProps {
  season: Season;
  fixtures: Fixture[];
  standings: StandingsRow[];
  teams: Team[];
  onToast: (type: 'success' | 'error' | 'warning', title: string, msg: string) => void;
  onNavigate: (screen: string) => void;
}

export const WeekManagementScreen: React.FC<WeekManagementScreenProps> = ({
  season,
  fixtures,
  standings,
  teams,
  onToast,
  onNavigate
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(season.currentWeek);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [extendReason, setExtendReason] = useState('');

  const weekFixtures = fixtures.filter(f => f.seasonId === season.id && f.weekNumber === selectedWeek);
  const completedFixtures = weekFixtures.filter(f => f.status === 'COMPLETED');
  const outstandingFixtures = weekFixtures.filter(f => f.status !== 'COMPLETED');

  const isCurrentWeek = selectedWeek === season.currentWeek;
  const isWeek15 = selectedWeek === 15;
  const isPlayoffs = selectedWeek >= 16;

  // Actions
  const handleOpenWeek = () => {
    try {
      DatabaseEngine.openWeek(season.id, selectedWeek);
      onToast('success', `Week ${selectedWeek} Opened`, `Week ${selectedWeek} fixtures are now open for scoring.`);
    } catch (e: any) {
      onToast('error', 'Action Failed', e.message);
    }
  };

  const handleCloseWeek = () => {
    try {
      DatabaseEngine.closeWeek(season.id, selectedWeek);
      onToast('warning', `Week ${selectedWeek} Closed`, `Week ${selectedWeek} has been closed.`);
    } catch (e: any) {
      onToast('error', 'Action Failed', e.message);
    }
  };

  const handleFinalizeWeek = () => {
    const res = DatabaseEngine.finalizeWeek(season.id, selectedWeek);
    if (res.success) {
      onToast('success', `Week ${selectedWeek} Finalized`, res.message);
      if (selectedWeek === 15) {
        onToast('warning', 'Playoff Quotas Locked', 'Week 15 completed! Quotas locked permanently and Week 16 Semifinals generated.');
      }
    } else {
      onToast('error', 'Action Failed', res.message);
    }
  };

  const handleExtendDeadline = () => {
    try {
      DatabaseEngine.extendWeekDeadline(season.id, selectedWeek, 24);
      onToast('success', 'Deadline Extended', `Extended Week ${selectedWeek} deadline by 24 hours.`);
      setIsExtendModalOpen(false);
    } catch (e: any) {
      onToast('error', 'Action Failed', e.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Week Management & Lifecycle Controls
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {season.name} • Active Week: <strong className="text-slate-800">{season.currentWeek}</strong> • Phase: <strong className="text-blue-600">{season.currentPhase.replace('_', ' ')}</strong>
          </p>
        </div>

        {/* Week Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar max-w-md p-1 bg-slate-100 rounded-xl border border-slate-200">
          {Array.from({ length: 17 }, (_, i) => i + 1).map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedWeek === w
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {w === 16 ? 'W16 Semi' : w === 17 ? 'W17 Final' : `W${w}`}
            </button>
          ))}
        </div>
      </div>

      {/* Week 15 Lock Notification Banner */}
      {selectedWeek === 15 && (
        <div className="p-5 bg-amber-50 rounded-xl border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <Lock className="w-5 h-5 text-amber-600" />
            <span>CRITICAL LEAGUE RULE: WEEK 15 PLAYOFF QUOTA LOCK</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Finalizing Week 15 officially closes the 15-week Regular Season. All team quotas will permanently freeze as locked Playoff Quotas for Week 16 and Week 17. The Top 4 positions in the standings table will automatically be seeded into the Championship Semifinals (1 vs 4, 2 vs 3), while positions 5–10 advance to the Consolation Bowl.
          </p>
        </div>
      )}

      {/* Week Status & Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Selected Week</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {selectedWeek === 16 ? 'Week 16 Semifinals' : selectedWeek === 17 ? 'Week 17 Championship' : `Week ${selectedWeek} of 15`}
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">
            {isCurrentWeek ? '● Active In Progress' : selectedWeek < season.currentWeek ? '✔ Prior Week' : '⏳ Scheduled Future'}
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Fixtures</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{weekFixtures.length}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">5 Matches in schedule</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Completed</span>
          <div className="text-xl font-bold text-blue-600 mt-1">{completedFixtures.length}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Finalized match scores</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Outstanding</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{outstandingFixtures.length}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting score submissions</span>
        </div>
      </div>

      {/* Week Operation Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Administrative Actions for Week {selectedWeek}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Open Week */}
          <button
            onClick={handleOpenWeek}
            className="p-5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 text-left transition space-y-2 group"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 w-fit">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Open Week</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Set status to OPEN and allow teams to submit weekly scores.
              </p>
            </div>
          </button>

          {/* Extend Deadline */}
          <button
            onClick={() => {
              setNewDeadline(weekFixtures[0]?.deadline || new Date().toISOString());
              setIsExtendModalOpen(true);
            }}
            className="p-5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 text-left transition space-y-2 group"
          >
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 w-fit">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Extend Deadline</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Grant deadline extension for all matches in Week {selectedWeek}.
              </p>
            </div>
          </button>

          {/* Close Week */}
          <button
            onClick={handleCloseWeek}
            className="p-5 rounded-xl bg-slate-50 hover:bg-red-50/50 border border-slate-200 hover:border-red-400 text-left transition space-y-2 group"
          >
            <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100 w-fit">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Close Week</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Close score entry. Apply automatic DNF (12 pts) to unentered matches.
              </p>
            </div>
          </button>

          {/* Finalize Week */}
          <button
            onClick={handleFinalizeWeek}
            className="p-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-left transition space-y-2 group shadow-sm"
          >
            <div className="p-2 rounded-lg bg-blue-500 text-white w-fit">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Finalize & Recalculate</h3>
              <p className="text-[11px] text-blue-100 mt-0.5">
                Lock standings, calculate table, and advance league to next week.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Extend Deadline Modal */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-xl border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Extend Week {selectedWeek} Deadline</h3>
              <button onClick={() => setIsExtendModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Submission Deadline (UTC)</label>
                <input
                  type="datetime-local"
                  value={newDeadline.slice(0, 16)}
                  onChange={e => setNewDeadline(new Date(e.target.value).toISOString())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Extension</label>
                <input
                  type="text"
                  value={extendReason}
                  onChange={e => setExtendReason(e.target.value)}
                  placeholder="e.g. Inclement weather or course maintenance delay"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendDeadline}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
              >
                Save Extension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
