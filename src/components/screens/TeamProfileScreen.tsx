import React from 'react';
import {
  Trophy, Users, Calendar, ArrowLeft, Lock, Unlock,
  TrendingUp, Award, Clock, ArrowUpRight, ArrowDownRight, Flag
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Team, Player, Fixture, TeamResult, StandingsRow, Season, Course } from '../../types';

interface TeamProfileScreenProps {
  teamId: number;
  season: Season;
  teams: Team[];
  players: Player[];
  fixtures: Fixture[];
  teamResults: TeamResult[];
  standings: StandingsRow[];
  courses: Course[];
  onBack: () => void;
}

export const TeamProfileScreen: React.FC<TeamProfileScreenProps> = ({
  teamId,
  season,
  teams,
  players,
  fixtures,
  teamResults,
  standings,
  courses,
  onBack
}) => {
  const team = teams.find(t => t.id === teamId);
  const playerA = players.find(p => p.id === team?.playerAId);
  const playerB = players.find(p => p.id === team?.playerBId);
  const standing = standings.find(s => s.teamId === teamId);

  if (!team) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Team not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs">
          Return
        </button>
      </div>
    );
  }

  // Get completed weekly results for this team
  const teamCompletedResults = teamResults
    .filter(tr => tr.teamId === team.id)
    .map(tr => {
      const fix = fixtures.find(f => f.id === tr.fixtureId);
      const course = courses.find(c => c.id === fix?.courseId);
      return {
        week: fix?.isPlayoff ? fix.phase : `W${fix?.weekNumber ?? 1}`,
        weekNum: fix?.weekNumber ?? 1,
        netResult: tr.weeklyNetResult,
        teamPoints: tr.teamPoints,
        quota: tr.teamQuota,
        result: tr.matchResult,
        courseName: course?.courseName || 'Links'
      };
    })
    .sort((a, b) => a.weekNum - b.weekNum);

  const netResultsArray = teamCompletedResults.map(r => r.netResult);
  const bestResult = netResultsArray.length > 0 ? Math.max(...netResultsArray) : 0;
  const worstResult = netResultsArray.length > 0 ? Math.min(...netResultsArray) : 0;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header & Position Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200"
            title="Back to Teams"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Rank #{standing?.position ?? 'N/A'} in Season
              </span>
              {team.quotaLocked ? (
                <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-2.5 h-2.5 text-amber-600" /> <span>Playoff Quota Locked</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Unlock className="w-2.5 h-2.5 text-blue-600" /> <span>Regular Season</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {team.teamName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {playerA?.displayName} &bull; {playerB?.displayName}
            </p>
          </div>
        </div>

        {/* Quota Highlights */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center space-x-6">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Current Quota</span>
            <span className="font-mono text-2xl font-bold text-blue-700">{team.currentQuota}</span>
          </div>
          {team.playoffQuota && (
            <div className="border-l border-slate-200 pl-6">
              <span className="text-[10px] text-amber-700 block uppercase font-bold tracking-wider">Playoff Quota</span>
              <span className="font-mono text-2xl font-bold text-amber-700">{team.playoffQuota} 🔒</span>
            </div>
          )}
        </div>
      </div>

      {/* Season Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Played</span>
          <span className="text-lg font-bold text-slate-900 mt-0.5">{standing?.played ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-blue-700 block font-bold">Wins</span>
          <span className="text-lg font-bold text-blue-700 mt-0.5">{standing?.wins ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Draws</span>
          <span className="text-lg font-bold text-slate-700 mt-0.5">{standing?.draws ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-rose-600 block font-semibold">Losses</span>
          <span className="text-lg font-bold text-rose-600 mt-0.5">{standing?.losses ?? 0}</span>
        </div>
        <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-center shadow-2xs">
          <span className="text-[10px] text-blue-800 block font-bold">Season Pts</span>
          <span className="text-lg font-bold text-blue-800 mt-0.5">{standing?.seasonPoints ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Net Result</span>
          <span className="text-lg font-bold font-mono text-blue-700 mt-0.5">
            {standing && standing.totalNetResult > 0 ? `+${standing.totalNetResult}` : (standing?.totalNetResult ?? 0)}
          </span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Best Week</span>
          <span className="text-lg font-bold font-mono text-blue-700 mt-0.5">
            {bestResult > 0 ? `+${bestResult}` : bestResult}
          </span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Worst Week</span>
          <span className="text-lg font-bold font-mono text-rose-600 mt-0.5">
            {worstResult > 0 ? `+${worstResult}` : worstResult}
          </span>
        </div>
      </div>

      {/* Interactive Trend Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">
              Weekly Net Result Progression
            </h2>
          </div>
          <span className="text-xs text-slate-500">Team Points minus Quota per week</span>
        </div>

        {teamCompletedResults.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamCompletedResults} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [`${val > 0 ? `+${val}` : val} Net Result`, 'Performance']}
                />
                <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="netResult"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7, stroke: '#1d4ed8', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
            No completed matches recorded yet for this team.
          </div>
        )}
      </div>

      {/* Match History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Weekly Match Log</h3>
          <span className="text-xs text-slate-500">{teamCompletedResults.length} Completed Rounds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Week</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-3 text-center">Team Pts</th>
                <th className="py-3 px-3 text-center">Quota</th>
                <th className="py-3 px-3 text-center font-bold text-blue-700">Weekly Net</th>
                <th className="py-3 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamCompletedResults.map((round, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{round.week}</td>
                  <td className="py-3 px-4 text-slate-700">{round.courseName}</td>
                  <td className="py-3 px-3 text-center font-mono font-medium">{round.teamPoints}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-500">{round.quota}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                    {round.netResult > 0 ? `+${round.netResult}` : round.netResult}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      round.result === 'WIN' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      round.result === 'DRAW' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {round.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
