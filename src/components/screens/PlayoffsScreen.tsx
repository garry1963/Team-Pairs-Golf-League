import React from 'react';
import { Trophy, Lock, Users, Flag, ArrowRight, ShieldCheck, CheckCircle2, Award } from 'lucide-react';
import { Season, Fixture, Team, Course, TeamResult, StandingsRow } from '../../types';

interface PlayoffsScreenProps {
  season: Season;
  fixtures: Fixture[];
  teams: Team[];
  courses: Course[];
  teamResults: TeamResult[];
  standings: StandingsRow[];
  onSelectFixture: (fixtureId: number) => void;
  onNavigate: (screen: string) => void;
}

export const PlayoffsScreen: React.FC<PlayoffsScreenProps> = ({
  season,
  fixtures,
  teams,
  courses,
  teamResults,
  standings,
  onSelectFixture,
  onNavigate
}) => {
  const teamMap = new Map<number, Team>();
  teams.forEach(t => teamMap.set(t.id, t));

  const courseMap = new Map<number, Course>();
  courses.forEach(c => courseMap.set(c.id, c));

  const top4 = standings.slice(0, 4);
  const semiFixtures = fixtures.filter(f => f.seasonId === season.id && f.isPlayoff && f.phase === 'SEMIFINALS');
  const thirdPlaceFixture = fixtures.filter(f => f.seasonId === season.id && f.isPlayoff && f.phase === 'THIRD_PLACE');

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Championship Playoffs (Week 16)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Top 4 Regular Season Finishers &bull; Irreversible Frozen Quotas &bull; Semifinals (1v4 & 2v3)
          </p>
        </div>

        <button
          onClick={() => onNavigate('championship')}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center space-x-2"
        >
          <span>Championship Final (Week 17)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Top 4 Seeded Teams Overview with Locked Quota */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Qualified Playoff Seeds & Frozen Playoff Quotas</span>
          </h3>
          <span className="text-xs text-amber-700 font-semibold flex items-center space-x-1 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            <Lock className="w-3 h-3 text-amber-600" /> <span>Week 15 Quotas Locked</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {top4.map((row, idx) => {
            const team = teamMap.get(row.teamId);
            return (
              <div
                key={row.teamId}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center border border-amber-200">
                      #{row.position}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{row.teamName}</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    {row.seasonPoints} Pts &bull; {row.totalNetResult > 0 ? `+${row.totalNetResult}` : row.totalNetResult} Net
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-700 font-bold block">Frozen Quota</span>
                  <span className="font-mono text-base font-bold text-amber-700">
                    {team?.playoffQuota || team?.currentQuota} 🔒
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Semifinal Matches Bracket */}
      <div className="space-y-4">
        <h2 className="font-bold text-slate-900 text-base">
          Week 16 Semifinal Fixtures
        </h2>

        {semiFixtures.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm space-y-2 shadow-sm">
            <p>Playoff Semifinals will automatically generate once Regular Season Week 15 is finalized.</p>
            <button
              onClick={() => onNavigate('week-management')}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              Go to Week Management
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {semiFixtures.map((fix, idx) => {
              const teamA = teamMap.get(fix.teamAId);
              const teamB = teamMap.get(fix.teamBId);
              const course = courseMap.get(fix.courseId);
              const resA = teamResults.find(r => r.fixtureId === fix.id && r.teamId === fix.teamAId);
              const resB = teamResults.find(r => r.fixtureId === fix.id && r.teamId === fix.teamBId);
              const isCompleted = fix.status === 'COMPLETED';

              return (
                <div
                  key={fix.id}
                  onClick={() => {
                    onSelectFixture(fix.id);
                    onNavigate('score-entry');
                  }}
                  className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 p-5 shadow-sm hover:shadow-md transition cursor-pointer space-y-4 group"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-bold text-blue-700 text-xs">
                      SEMIFINAL #{idx + 1} ({idx === 0 ? 'Seed 1 vs Seed 4' : 'Seed 2 vs Seed 3'})
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {course?.courseName || 'Links Championship Course'} (Par {course?.par || 72})
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Team A */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>{teamA?.teamName}</span>
                          {fix.winnerTeamId === teamA?.id && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ADVANCED TO FINAL
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Locked Quota: {teamA?.playoffQuota || teamA?.currentQuota} 🔒
                        </span>
                      </div>
                      {resA && (
                        <span className="font-mono text-base font-bold text-blue-700">
                          {resA.weeklyNetResult > 0 ? `+${resA.weeklyNetResult}` : resA.weeklyNetResult} Net
                        </span>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>{teamB?.teamName}</span>
                          {fix.winnerTeamId === teamB?.id && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ADVANCED TO FINAL
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Locked Quota: {teamB?.playoffQuota || teamB?.currentQuota} 🔒
                        </span>
                      </div>
                      {resB && (
                        <span className="font-mono text-base font-bold text-blue-700">
                          {resB.weeklyNetResult > 0 ? `+${resB.weeklyNetResult}` : resB.weeklyNetResult} Net
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      {isCompleted ? 'Match Finalized' : 'Click to enter semifinal scores'}
                    </span>
                    <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition">
                      {isCompleted ? 'Review Scores →' : 'Enter Scores →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
