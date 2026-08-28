import React, { useEffect } from 'react';
import { Trophy, Award, Lock, Sparkles, Flag, Calendar, ArrowLeft, Download, FileText, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Season, Fixture, Team, Player, Course, TeamResult } from '../../types';
import { ExportService } from '../../services/exportService';

interface ChampionshipScreenProps {
  season: Season;
  fixtures: Fixture[];
  teams: Team[];
  players: Player[];
  courses: Course[];
  teamResults: TeamResult[];
  onSelectFixture: (fixtureId: number) => void;
  onNavigate: (screen: string) => void;
}

export const ChampionshipScreen: React.FC<ChampionshipScreenProps> = ({
  season,
  fixtures,
  teams,
  players,
  courses,
  teamResults,
  onSelectFixture,
  onNavigate
}) => {
  const teamMap = new Map<number, Team>();
  teams.forEach(t => teamMap.set(t.id, t));

  const playerMap = new Map<number, Player>();
  players.forEach(p => playerMap.set(p.id, p));

  const championshipFixture = fixtures.find(f => f.seasonId === season.id && f.isPlayoff && f.phase === 'CHAMPIONSHIP');
  const thirdPlaceFixture = fixtures.find(f => f.seasonId === season.id && f.isPlayoff && f.phase === 'THIRD_PLACE');

  const champTeamA = teamMap.get(championshipFixture?.teamAId || 0);
  const champTeamB = teamMap.get(championshipFixture?.teamBId || 0);
  const course = courses.find(c => c.id === championshipFixture?.courseId);

  const resA = teamResults.find(r => r.fixtureId === championshipFixture?.id && r.teamId === championshipFixture?.teamAId);
  const resB = teamResults.find(r => r.fixtureId === championshipFixture?.id && r.teamId === championshipFixture?.teamBId);

  const isChampCompleted = championshipFixture?.status === 'COMPLETED';
  const championTeam = isChampCompleted ? teamMap.get(championshipFixture?.winnerTeamId || 0) : null;
  const runnerUpTeam = isChampCompleted
    ? (championshipFixture?.winnerTeamId === champTeamA?.id ? champTeamB : champTeamA)
    : null;

  const champP1 = playerMap.get(championTeam?.playerAId || 0);
  const champP2 = playerMap.get(championTeam?.playerBId || 0);

  // Trigger celebration confetti on championship victory!
  useEffect(() => {
    if (isChampCompleted && championTeam) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isChampCompleted, championTeam]);

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Trophy className="w-7 h-7 text-amber-500 animate-bounce" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Championship Grand Final (Week 17)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            The Pinnacle of the Pairs Golf League &bull; Crown the Season Champion
          </p>
        </div>

        <button
          onClick={() => onNavigate('playoffs')}
          className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Semifinals</span>
        </button>
      </div>

      {/* Champion Podium Presentation if Completed */}
      {isChampCompleted && championTeam && (
        <div className="bg-slate-50 p-8 rounded-2xl border-2 border-amber-300 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-4xl shadow-md border-2 border-amber-300 ring-8 ring-amber-200/50">
            🏆
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
              Official League Champions
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {championTeam.teamName}
            </h2>
            <p className="text-sm font-semibold text-slate-600">
              {champP1?.displayName} &bull; {champP2?.displayName}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-2 text-xs">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Championship Final Score</span>
              <span className="font-mono text-lg font-bold text-blue-700 mt-1 block">
                {resA?.weeklyNetResult !== undefined && resB?.weeklyNetResult !== undefined
                  ? `${champTeamA?.teamName} (${resA.weeklyNetResult > 0 ? `+${resA.weeklyNetResult}` : resA.weeklyNetResult}) vs ${champTeamB?.teamName} (${resB.weeklyNetResult > 0 ? `+${resB.weeklyNetResult}` : resB.weeklyNetResult})`
                  : 'Victory by Decision'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Runner-Up Finalist</span>
              <span className="font-bold text-slate-800 text-sm mt-1 block">{runnerUpTeam?.teamName || 'Finalist'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Championship Match Card */}
      {!championshipFixture ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm space-y-2 shadow-sm">
          <p>Championship Grand Final will generate once Week 16 Semifinals are concluded.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                Championship Match #17
              </span>
              <h3 className="font-bold text-slate-900 text-lg">
                {champTeamA?.teamName || 'Semifinal Winner 1'} vs {champTeamB?.teamName || 'Semifinal Winner 2'}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block">{course?.courseName || 'Links Course'}</span>
              <span className="text-[10px] text-blue-700 font-semibold">Par {course?.par || 72} &bull; Locked Playoff Quotas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team A */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base">{champTeamA?.teamName || 'TBD'}</h4>
                <p className="text-xs text-slate-500 font-medium">Locked Quota: {champTeamA?.playoffQuota || champTeamA?.currentQuota} 🔒</p>
              </div>
              {resA && (
                <span className="font-mono text-2xl font-bold text-blue-700">
                  {resA.weeklyNetResult > 0 ? `+${resA.weeklyNetResult}` : resA.weeklyNetResult} Net
                </span>
              )}
            </div>

            {/* Team B */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base">{champTeamB?.teamName || 'TBD'}</h4>
                <p className="text-xs text-slate-500 font-medium">Locked Quota: {champTeamB?.playoffQuota || champTeamB?.currentQuota} 🔒</p>
              </div>
              {resB && (
                <span className="font-mono text-2xl font-bold text-blue-700">
                  {resB.weeklyNetResult > 0 ? `+${resB.weeklyNetResult}` : resB.weeklyNetResult} Net
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                onSelectFixture(championshipFixture.id);
                onNavigate('score-entry');
              }}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4" />
              <span>{isChampCompleted ? 'Edit Championship Scores' : 'Enter Championship Scores'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
