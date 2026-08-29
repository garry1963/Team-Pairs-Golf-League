import React, { useState, useEffect } from 'react';
import {
  Trophy, Users, Calendar, Clock, ArrowRight, ShieldCheck,
  ChevronRight, AlertCircle, Award, CheckCircle2, TrendingUp, Edit3, Flag
} from 'lucide-react';
import { Season, StandingsRow, Fixture, Team, TeamResult } from '../../types';
import { DeadlineService, CountdownState } from '../../engine/deadline';

interface DashboardScreenProps {
  season: Season;
  standings: StandingsRow[];
  fixtures: Fixture[];
  teams: Team[];
  teamResults: TeamResult[];
  onNavigate: (screen: string) => void;
  onSelectFixture: (fixtureId: number) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  season,
  standings,
  fixtures,
  teams,
  teamResults,
  onNavigate,
  onSelectFixture
}) => {
  const [countdown, setCountdown] = useState<CountdownState>({
    expired: false,
    hours: '02',
    minutes: '14',
    seconds: '35',
    totalSeconds: 8075,
    displayText: '02 : 14 : 35'
  });

  const activeWeekFixture = fixtures.find(f => f.seasonId === season.id && f.weekNumber === season.currentWeek);
  const currentWeekDeadline = activeWeekFixture?.deadline;

  useEffect(() => {
    const updateCountdown = () => {
      if (currentWeekDeadline) {
        setCountdown(DeadlineService.getRemainingTime(currentWeekDeadline));
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [currentWeekDeadline]);

  const regularFixtures = fixtures.filter(f => f.seasonId === season.id && !f.isPlayoff);
  const completedFixtures = regularFixtures.filter(f => f.status === 'COMPLETED');
  const weekResults = activeWeekFixture ? teamResults.filter(r => r.fixtureId === activeWeekFixture.id) : [];

  const teamMap = new Map<number, Team>();
  teams.forEach(t => teamMap.set(t.id, t));

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {season.currentPhase.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Week <strong className="text-slate-900">{season.currentWeek}</strong> of {season.totalWeeks}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {season.name}
          </h1>
          <p className="text-xs text-slate-500">
            Official 10-Team Pairs Golf League &bull; All Teams Field Round &bull; Automated Quota &amp; Net Scoring
          </p>
        </div>

        {/* Live Submission Countdown Timer */}
        <div className="bg-slate-900 p-4 rounded-xl shadow-xs flex flex-col items-center md:items-end justify-center min-w-[220px]">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Score Submission Window</span>
          </div>
          <div className="font-mono text-2xl font-black text-amber-300 tracking-widest">
            {countdown.displayText}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Week {season.currentWeek} Official Cutoff
          </span>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Teams</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{teams.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All teams active weekly</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Current Round</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            Week {season.currentWeek} <span className="text-xs text-slate-400 font-normal">/ {regularFixtures.length}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {season.currentWeek >= 15 ? 'Playoff Zone' : 'Regular Season'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Completed Weeks</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {completedFixtures.length} <span className="text-xs text-slate-400 font-normal">/ {regularFixtures.length}</span>
          </div>
          <div className="text-[11px] text-green-600 font-medium mt-0.5">Finalized rounds</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Week Submissions</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {weekResults.length} <span className="text-xs text-slate-400 font-normal">/ {teams.length}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Teams submitted for Week {season.currentWeek}</div>
        </div>
      </div>

      {/* Main Grid: Standings (Left 7 cols) & Active Week Round (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top Standings */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-800 text-base">
                Current Standings (Top 5)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('standings')}
              className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center space-x-1 transition"
            >
              <span>Full League Table</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Top 5 Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Pos</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3 text-center font-bold text-blue-700 bg-blue-50/50">Season Pts</th>
                  <th className="py-2.5 px-3 text-center">Team Pts</th>
                  <th className="py-2.5 px-3 text-right">Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {standings.slice(0, 5).map((row, idx) => (
                  <tr
                    key={row.teamId}
                    className="hover:bg-slate-50 transition group cursor-pointer"
                    onClick={() => onNavigate('standings')}
                  >
                    <td className="py-3 px-3 font-bold text-slate-800">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        idx < 4 ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {row.position}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 group-hover:text-blue-600">
                      <div>{row.teamName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{row.playerAName} &amp; {row.playerBName}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700 bg-blue-50/50">
                      <span className={`font-mono ${row.seasonPoints > 0 ? 'text-green-700' : row.seasonPoints < 0 ? 'text-rose-700' : 'text-blue-700'}`}>
                        {row.seasonPoints > 0 ? `+${row.seasonPoints}` : row.seasonPoints}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {row.totalTeamPoints}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                      {row.currentQuota}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              <span>Positions 1–4 Qualify for Week 16 Semifinals</span>
            </span>
            <span className="text-slate-400 font-medium">Quotas Lock after Week 15</span>
          </div>
        </div>

        {/* Right Column: Active Week Fixture Round & Submissions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Week {season.currentWeek} Fixture Round
                </h3>
              </div>
              <button
                onClick={() => onNavigate('fixtures')}
                className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition"
              >
                All Weeks &rarr;
              </button>
            </div>

            {/* Week Status Banner */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 block">Weekly Field Round</span>
                <span className="text-xs font-semibold text-slate-900">
                  {weekResults.length} of {teams.length} Teams Submitted
                </span>
              </div>
              <button
                onClick={() => {
                  if (activeWeekFixture) onSelectFixture(activeWeekFixture.id);
                  onNavigate('score-entry');
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Enter Scores</span>
              </button>
            </div>

            {/* List of Teams in Current Week */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {teams.map(t => {
                const res = activeWeekFixture ? teamResults.find(r => r.fixtureId === activeWeekFixture.id && r.teamId === t.id) : null;

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{t.teamName}</div>
                      <div className="text-[10px] text-slate-400">Quota: {t.currentQuota} pts</div>
                    </div>

                    <div className="text-right">
                      {res ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          res.weeklyNetResult >= 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {res.weeklyNetResult >= 0 ? `+${res.weeklyNetResult}` : res.weeklyNetResult} Net
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('score-entry')}
              className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs font-semibold text-xs flex items-center justify-center space-x-2 transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>Score Entry Center</span>
            </button>
            <button
              onClick={() => onNavigate('week-management')}
              className="p-3.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl border border-slate-200 shadow-xs font-semibold text-xs flex items-center justify-center space-x-2 transition"
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Week Management</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
