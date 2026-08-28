import React from 'react';
import { Shield, Trophy, Award, Lock, ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { Season, Fixture, Team, Course, TeamResult, StandingsRow } from '../../types';

interface ConsolationBowlScreenProps {
  season: Season;
  fixtures: Fixture[];
  teams: Team[];
  courses: Course[];
  teamResults: TeamResult[];
  standings: StandingsRow[];
  onSelectFixture: (fixtureId: number) => void;
  onNavigate: (screen: string) => void;
}

export const ConsolationBowlScreen: React.FC<ConsolationBowlScreenProps> = ({
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

  const consolationFixtures = fixtures.filter(f => f.seasonId === season.id && f.isPlayoff && f.phase === 'CONSOLATION');
  const consolationTeams = standings.slice(4, 10);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Consolation Bowl Championship (Seeds 5–10)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Postseason Tournament for Regular Season Finishers 5 through 10 &bull; Frozen Quotas Apply
          </p>
        </div>

        <button
          onClick={() => onNavigate('playoffs')}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
        >
          <span>Top 4 Championship Semifinals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Qualified Consolation Seeds */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          Consolation Bowl Competitors (Regular Season Standings #5–#10)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {consolationTeams.map((row) => (
            <div key={row.teamId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5 shadow-2xs">
              <span className="w-5 h-5 mx-auto rounded-md bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-300">
                #{row.position}
              </span>
              <div className="font-bold text-slate-900 text-xs truncate">{row.teamName}</div>
              <div className="text-[10px] text-slate-500 font-mono font-medium">Quota: {row.currentQuota} 🔒</div>
            </div>
          ))}
        </div>
      </div>

      {/* Consolation Matches */}
      <div className="space-y-4">
        <h2 className="font-bold text-slate-900 text-base">
          Consolation Fixtures
        </h2>

        {consolationFixtures.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm space-y-2 shadow-sm">
            <p>Consolation Bowl matches will be seeded upon conclusion of Regular Season Week 15.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consolationFixtures.map((fix) => {
              const teamA = teamMap.get(fix.teamAId);
              const teamB = teamMap.get(fix.teamBId);
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
                  className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 p-5 shadow-sm hover:shadow-md transition cursor-pointer space-y-3.5 group"
                >
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
                    <span className="font-bold text-slate-900">Consolation Match #{fix.id}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Week {fix.weekNumber}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-900 text-xs">{teamA?.teamName}</span>
                      {resA && (
                        <span className="font-mono text-blue-700 font-bold text-xs">
                          {resA.weeklyNetResult > 0 ? `+${resA.weeklyNetResult}` : resA.weeklyNetResult} Net
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-900 text-xs">{teamB?.teamName}</span>
                      {resB && (
                        <span className="font-mono text-blue-700 font-bold text-xs">
                          {resB.weeklyNetResult > 0 ? `+${resB.weeklyNetResult}` : resB.weeklyNetResult} Net
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">Locked Quota Scoring</span>
                    <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition text-[11px]">
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
