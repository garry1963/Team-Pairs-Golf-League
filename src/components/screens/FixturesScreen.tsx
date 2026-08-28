import React, { useState } from 'react';
import { Calendar, Flag, Edit3, CheckCircle2, Clock, Trophy, AlertCircle, ArrowRight } from 'lucide-react';
import { Fixture, Season, Team, Course, TeamResult } from '../../types';

interface FixturesScreenProps {
  season: Season;
  fixtures: Fixture[];
  teams: Team[];
  courses: Course[];
  teamResults: TeamResult[];
  onSelectFixture: (fixtureId: number) => void;
  onNavigate: (screen: string) => void;
}

export const FixturesScreen: React.FC<FixturesScreenProps> = ({
  season,
  fixtures,
  teams,
  courses,
  teamResults,
  onSelectFixture,
  onNavigate
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(season.currentWeek);

  const teamMap = new Map<number, Team>();
  teams.forEach(t => teamMap.set(t.id, t));

  const courseMap = new Map<number, Course>();
  courses.forEach(c => courseMap.set(c.id, c));

  // Determine available tabs: 1..15 regular season, 16 Semifinals/Consolation, 17 Championship
  const maxWeeks = Math.max(15, season.currentWeek);
  const weekTabs = Array.from({ length: 15 }, (_, i) => i + 1);

  const filteredFixtures = fixtures.filter(f => f.seasonId === season.id && f.weekNumber === selectedWeek);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Weekly Fixtures & Match Schedule
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {season.name} &bull; 5 Matches per week &bull; Click any match card to enter or review scores
          </p>
        </div>

        {/* Quick Active Week Switcher */}
        <button
          onClick={() => setSelectedWeek(season.currentWeek)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-2"
        >
          <span>Jump to Active (Week {season.currentWeek})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Week Selector Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 custom-scrollbar">
        {weekTabs.map(w => {
          const isCurrent = season.currentWeek === w;
          const isSelected = selectedWeek === w;
          const weekFix = fixtures.filter(f => f.seasonId === season.id && f.weekNumber === w);
          const allCompleted = weekFix.length > 0 && weekFix.every(f => f.status === 'COMPLETED');

          return (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>Week {w}</span>
              {allCompleted ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : isCurrent ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ) : null}
            </button>
          );
        })}

        {/* Playoff Week 16 Tab */}
        <button
          onClick={() => setSelectedWeek(16)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 border ${
            selectedWeek === 16
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Week 16 Semifinals</span>
        </button>

        {/* Championship Week 17 Tab */}
        <button
          onClick={() => setSelectedWeek(17)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 border ${
            selectedWeek === 17
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Week 17 Championship</span>
        </button>
      </div>

      {/* Fixtures List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold text-slate-800">
            {selectedWeek === 16
              ? 'Week 16 Postseason (Semifinals & Consolation Matches)'
              : selectedWeek === 17
              ? 'Week 17 Championship Match'
              : `Week ${selectedWeek} Regular Season Fixtures (${filteredFixtures.length} Matches)`}
          </span>
          <span>Click any card to open score entry</span>
        </div>

        {filteredFixtures.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm space-y-2">
            <p>No fixtures generated yet for Week {selectedWeek}.</p>
            {selectedWeek >= 16 && (
              <p className="text-xs text-amber-600 font-medium">
                Playoff matches will automatically generate when Week 15 regular season is finalized!
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFixtures.map((fix) => {
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
                  className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-4"
                >
                  {/* Fixture Top Info */}
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Flag className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-semibold text-slate-800">{course?.courseName || 'Championship Course'}</span>
                      <span>(Par {course?.par || 72})</span>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                          COMPLETED
                        </span>
                      ) : fix.status === 'OPEN' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                          OPEN FOR SCORES
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          SCHEDULED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Teams & Live Scores */}
                  <div className="space-y-3">
                    {/* Team A */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>{teamA?.teamName || 'Team A'}</span>
                          {fix.winnerTeamId === teamA?.id && (
                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                              WINNER
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Quota: {teamA?.currentQuota} {teamA?.quotaLocked && '🔒'}
                        </div>
                      </div>

                      {resA ? (
                        <div className="text-right">
                          <div className="font-mono text-base font-black text-green-600">
                            {resA.weeklyNetResult > 0 ? `+${resA.weeklyNetResult}` : resA.weeklyNetResult} Net
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {resA.teamPoints} Team Pts
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">--</span>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>{teamB?.teamName || 'Team B'}</span>
                          {fix.winnerTeamId === teamB?.id && (
                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                              WINNER
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Quota: {teamB?.currentQuota} {teamB?.quotaLocked && '🔒'}
                        </div>
                      </div>

                      {resB ? (
                        <div className="text-right">
                          <div className="font-mono text-base font-black text-green-600">
                            {resB.weeklyNetResult > 0 ? `+${resB.weeklyNetResult}` : resB.weeklyNetResult} Net
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {resB.teamPoints} Team Pts
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">--</span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-slate-400">
                      Date: {fix.fixtureDate}
                    </span>
                    <span className="text-blue-600 font-semibold text-xs flex items-center space-x-1 group-hover:translate-x-0.5 transition">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Review / Edit Scores' : 'Enter Scores'}</span>
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

