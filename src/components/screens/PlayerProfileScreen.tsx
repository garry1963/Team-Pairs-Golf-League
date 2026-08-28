import React from 'react';
import { Users, ArrowLeft, Trophy, Calendar, Flag, Award, AlertTriangle, TrendingUp } from 'lucide-react';
import { Player, Team, PlayerScore, Fixture, Course } from '../../types';

interface PlayerProfileScreenProps {
  playerId: number;
  players: Player[];
  teams: Team[];
  playerScores: PlayerScore[];
  fixtures: Fixture[];
  courses: Course[];
  onBack: () => void;
}

export const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  playerId,
  players,
  teams,
  playerScores,
  fixtures,
  courses,
  onBack
}) => {
  const player = players.find(p => p.id === playerId);
  const team = teams.find(t => t.playerAId === playerId || t.playerBId === playerId);

  if (!player) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Player profile not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs">
          Return
        </button>
      </div>
    );
  }

  // Completed rounds for this player
  const scores = playerScores.filter(s => s.playerId === player.id && s.scoreStatus !== 'PENDING');
  const validGrossScores = scores.filter(s => s.grossScore !== null).map(s => s.grossScore!);
  const validRelativeToPar = scores.filter(s => s.relativeToPar !== null).map(s => s.relativeToPar!);
  const leaguePointsList = scores.map(s => s.leaguePoints);

  const roundsPlayed = scores.length;
  const dnfs = scores.filter(s => s.scoreStatus === 'DNF').length;

  const avgGross = validGrossScores.length > 0
    ? (validGrossScores.reduce((a, b) => a + b, 0) / validGrossScores.length).toFixed(1)
    : 'N/A';
  const bestGross = validGrossScores.length > 0 ? Math.min(...validGrossScores) : 'N/A';

  const avgRel = validRelativeToPar.length > 0
    ? (validRelativeToPar.reduce((a, b) => a + b, 0) / validRelativeToPar.length).toFixed(1)
    : 'N/A';
  const bestRel = validRelativeToPar.length > 0 ? Math.min(...validRelativeToPar) : 'N/A';

  const avgPts = leaguePointsList.length > 0
    ? (leaguePointsList.reduce((a, b) => a + b, 0) / leaguePointsList.length).toFixed(1)
    : 'N/A';
  const highestPts = leaguePointsList.length > 0 ? Math.max(...leaguePointsList) : 'N/A';
  const lowestPts = leaguePointsList.length > 0 ? Math.min(...leaguePointsList) : 'N/A';

  // Build rounds list
  const roundsHistory = scores.map(s => {
    const fix = fixtures.find(f => f.id === s.fixtureId);
    const course = courses.find(c => c.id === fix?.courseId);
    return {
      fixtureId: s.fixtureId,
      week: fix?.isPlayoff ? fix.phase : `Week ${fix?.weekNumber ?? 1}`,
      date: fix?.fixtureDate || '2026-06-01',
      courseName: course?.courseName || 'Links Championship Course',
      par: course?.par || 72,
      grossScore: s.grossScore,
      relativeToPar: s.relativeToPar,
      leaguePoints: s.leaguePoints,
      status: s.scoreStatus
    };
  });

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200"
            title="Back to Players"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {team ? team.teamName : 'Free Agent'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Handicap: <strong className="text-amber-700 font-bold">{player.handicap ?? 0}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {player.displayName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {player.email || 'No email'} &bull; {player.phone || 'No phone'}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center space-x-6 text-center">
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Rounds</span>
            <span className="font-mono text-xl font-bold text-slate-900">{roundsPlayed}</span>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <span className="text-[10px] text-blue-700 block font-bold uppercase tracking-wider">Avg League Pts</span>
            <span className="font-mono text-xl font-bold text-blue-700">{avgPts}</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Avg Gross Score</span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-1">{avgGross}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-blue-700 block font-bold">Best Gross Score</span>
          <span className="text-lg font-bold font-mono text-blue-700 mt-1">{bestGross}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Avg To Par</span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-1">
            {typeof avgRel === 'string' && avgRel !== 'N/A' && Number(avgRel) > 0 ? `+${avgRel}` : avgRel}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-blue-700 block font-bold">Best To Par</span>
          <span className="text-lg font-bold font-mono text-blue-700 mt-1">
            {typeof bestRel === 'number' && bestRel > 0 ? `+${bestRel}` : bestRel}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-amber-800 block font-bold">Highest League Pts</span>
          <span className="text-lg font-bold font-mono text-amber-700 mt-1">{highestPts}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">DNFs Recorded</span>
          <span className="text-lg font-bold font-mono text-slate-700 mt-1">{dnfs}</span>
        </div>
      </div>

      {/* Round Scoring Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Individual Round History</h3>
          <span className="text-xs text-slate-500">{roundsHistory.length} Total Rounds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Week & Match</th>
                <th className="py-3 px-4">Host Course</th>
                <th className="py-3 px-3 text-center">Gross Score</th>
                <th className="py-3 px-3 text-center">Relative to Par</th>
                <th className="py-3 px-3 text-center font-bold text-blue-700">League Points</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roundsHistory.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{r.week}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{r.date}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    {r.courseName} <span className="text-[10px] text-slate-400 font-medium">(Par {r.par})</span>
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                    {r.status === 'DNF' ? <span className="text-amber-700">DNF</span> : r.grossScore}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-medium">
                    {r.status === 'DNF' ? (
                      <span className="text-slate-400">--</span>
                    ) : (
                      <span className={r.relativeToPar !== null && r.relativeToPar <= 0 ? 'text-blue-700 font-bold' : 'text-slate-700'}>
                        {r.relativeToPar !== null ? (r.relativeToPar > 0 ? `+${r.relativeToPar}` : r.relativeToPar) : '--'}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-sm text-blue-700">
                    {r.leaguePoints} pts
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'DNF'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {r.status}
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
