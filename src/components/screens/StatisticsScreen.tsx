import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Trophy, TrendingUp, Users, Award, Shield, ArrowUpRight } from 'lucide-react';
import { StandingsRow, Player, PlayerScore, Team, Season, TeamResult } from '../../types';

interface StatisticsScreenProps {
  season: Season;
  standings: StandingsRow[];
  players: Player[];
  playerScores: PlayerScore[];
  teams: Team[];
  teamResults: TeamResult[];
  onSelectPlayer: (id: number) => void;
  onSelectTeam: (id: number) => void;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  season,
  standings,
  players,
  playerScores,
  teams,
  teamResults,
  onSelectPlayer,
  onSelectTeam
}) => {
  // Individual Player Leaderboard calculations
  const playerStats = players.map(player => {
    const scores = playerScores.filter(s => s.playerId === player.id && s.scoreStatus !== 'PENDING');
    const validGross = scores.filter(s => s.grossScore !== null).map(s => s.grossScore!);
    const validRel = scores.filter(s => s.relativeToPar !== null).map(s => s.relativeToPar!);
    const totalPts = scores.reduce((sum, s) => sum + s.leaguePoints, 0);
    const avgPts = scores.length > 0 ? Number((totalPts / scores.length).toFixed(1)) : 0;
    const bestGross = validGross.length > 0 ? Math.min(...validGross) : 999;
    const bestRel = validRel.length > 0 ? Math.min(...validRel) : 999;

    return {
      player,
      rounds: scores.length,
      totalPts,
      avgPts,
      bestGross: bestGross === 999 ? null : bestGross,
      bestRel: bestRel === 999 ? null : bestRel
    };
  });

  const topScorers = [...playerStats].sort((a, b) => b.avgPts - a.avgPts).slice(0, 5);
  const bestGrossPlayers = [...playerStats].filter(p => p.bestGross !== null).sort((a, b) => a.bestGross! - b.bestGross!).slice(0, 5);

  // Standings Points Chart Data
  const teamPointsData = standings.map(s => ({
    teamName: s.teamName.length > 10 ? s.teamName.slice(0, 8) + '..' : s.teamName,
    seasonPoints: s.seasonPoints,
    netResult: s.totalNetResult
  }));

  // Weekly Average Net Trend
  const weeklyAvgData = Array.from({ length: season.currentWeek }, (_, i) => i + 1).map(w => {
    const weekResults = teamResults.filter(r => r.weekNumber === w);
    const avgNet = weekResults.length > 0
      ? Number((weekResults.reduce((a, b) => a + b.weeklyNetResult, 0) / weekResults.length).toFixed(1))
      : 0;
    return {
      week: `W${w}`,
      avgNet
    };
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              League Analytics & Leaderboards
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {season.name} &bull; Aggregate Statistics & Individual Performance Leaders
          </p>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Season Points Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Team Season Points Distribution
            </h3>
            <span className="text-[11px] text-slate-500">All 10 Teams</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPointsData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="teamName" stroke="#64748b" fontSize={10} angle={-30} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="seasonPoints" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Net Result Trend */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Weekly League Average Net Trend
            </h3>
            <span className="text-[11px] text-slate-500">Weeks 1 to {season.currentWeek}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyAvgData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="avgNet" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#1d4ed8', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Individual Leaderboard Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Individual Average Points */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Top Individual Point Scorers (Avg Pts)
            </h3>
          </div>

          <div className="space-y-2">
            {topScorers.map((st, idx) => (
              <div
                key={st.player.id}
                onClick={() => onSelectPlayer(st.player.id)}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 flex items-center justify-between cursor-pointer transition group"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition">
                      {st.player.displayName}
                    </div>
                    <div className="text-[10px] text-slate-500">{st.rounds} Rounds Recorded</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-blue-700">{st.avgPts}</span>
                  <span className="text-[10px] text-slate-500 block">avg pts / round</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lowest Gross Score Leaders */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <Trophy className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Best Individual Gross Scores
            </h3>
          </div>

          <div className="space-y-2">
            {bestGrossPlayers.map((st, idx) => (
              <div
                key={st.player.id}
                onClick={() => onSelectPlayer(st.player.id)}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 flex items-center justify-between cursor-pointer transition group"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition">
                      {st.player.displayName}
                    </div>
                    <div className="text-[10px] text-slate-500">Handicap: {st.player.handicap ?? 0}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-amber-700">{st.bestGross}</span>
                  <span className="text-[10px] text-slate-500 block">
                    {st.bestRel !== null ? (st.bestRel > 0 ? `+${st.bestRel} to par` : `${st.bestRel} to par`) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
