import React, { useState, useEffect } from 'react';
import {
  Trophy, Users, Calendar, Clock, ArrowRight, ShieldCheck,
  ChevronRight, AlertCircle, Award, CheckCircle2, TrendingUp, Edit3
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

  const activeWeekFixtures = fixtures.filter(f => f.seasonId === season.id && f.weekNumber === season.currentWeek);
  const currentWeekDeadline = activeWeekFixtures[0]?.deadline;

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

  const completedFixtures = fixtures.filter(f => f.seasonId === season.id && f.status === 'COMPLETED');
  const outstandingFixtures = activeWeekFixtures.filter(f => f.status !== 'COMPLETED');
  const leader = standings[0];

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
            Official 10-Team Pairs Golf League Management • Automated Quota & Net Scoring
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

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Teams</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{teams.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pairs in league</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Players</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">20</div>
          <div className="text-[11px] text-slate-400 mt-0.5">2 Players / team</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Leader</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1 truncate">
            {leader ? leader.teamName : 'TBD'}
          </div>
          <div className="text-[11px] text-green-600 font-medium mt-0.5">
            {leader ? `${leader.seasonPoints} pts (${leader.totalNetResult > 0 ? `+${leader.totalNetResult}` : leader.totalNetResult} Net)` : ''}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Current Week</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {season.currentWeek} <span className="text-xs text-slate-400 font-normal">/ {season.totalWeeks}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {season.currentWeek >= 15 ? 'Playoff Zone' : 'Regular Season'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {completedFixtures.length} <span className="text-xs text-slate-400 font-normal">/ {fixtures.length}</span>
          </div>
          <div className="text-[11px] text-green-600 font-medium mt-0.5">Finalized matches</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Outstanding</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {outstandingFixtures.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Matches pending</div>
        </div>
      </div>

      {/* Main Grid: Top 5 Standings & Latest / Upcoming Fixtures */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top 5 Standings (7 cols) */}
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
                  <th className="py-2.5 px-2 text-center">P</th>
                  <th className="py-2.5 px-2 text-center">W</th>
                  <th className="py-2.5 px-2 text-center">D</th>
                  <th className="py-2.5 px-2 text-center">L</th>
                  <th className="py-2.5 px-3 text-center font-bold text-blue-700">Season Pts</th>
                  <th className="py-2.5 px-3 text-right">Net</th>
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
                      <div className="text-[10px] text-slate-400 font-normal">{row.playerAName} & {row.playerBName}</div>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-600">{row.played}</td>
                    <td className="py-3 px-2 text-center font-semibold text-green-600">{row.wins}</td>
                    <td className="py-3 px-2 text-center text-slate-400">{row.draws}</td>
                    <td className="py-3 px-2 text-center text-red-500">{row.losses}</td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700 bg-blue-50/50">
                      {row.seasonPoints}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={row.totalNetResult >= 0 ? 'text-green-600' : 'text-red-500'}>
                        {row.totalNetResult > 0 ? `+${row.totalNetResult}` : row.totalNetResult}
                      </span>
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

        {/* Right Column: Latest Results & Next Fixtures (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Week Matches */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Week {season.currentWeek} Fixtures
                </h3>
              </div>
              <button
                onClick={() => onNavigate('fixtures')}
                className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition"
              >
                All Weeks &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {activeWeekFixtures.slice(0, 4).map(fix => {
                const teamA = teamMap.get(fix.teamAId);
                const teamB = teamMap.get(fix.teamBId);
                const resA = teamResults.find(r => r.fixtureId === fix.id && r.teamId === fix.teamAId);
                const resB = teamResults.find(r => r.fixtureId === fix.id && r.teamId === fix.teamBId);

                return (
                  <div
                    key={fix.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={fix.winnerTeamId === fix.teamAId ? 'text-blue-700 font-bold' : 'text-slate-800'}>
                          {teamA?.teamName}
                        </span>
                        {resA && (
                          <span className="font-mono text-green-600 font-bold">
                            {resA.weeklyNetResult > 0 ? `+${resA.weeklyNetResult}` : resA.weeklyNetResult}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={fix.winnerTeamId === fix.teamBId ? 'text-blue-700 font-bold' : 'text-slate-800'}>
                          {teamB?.teamName}
                        </span>
                        {resB && (
                          <span className="font-mono text-green-600 font-bold">
                            {resB.weeklyNetResult > 0 ? `+${resB.weeklyNetResult}` : resB.weeklyNetResult}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {fix.status === 'COMPLETED' ? (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          FINAL
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectFixture(fix.id);
                            onNavigate('score-entry');
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Enter</span>
                        </button>
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

