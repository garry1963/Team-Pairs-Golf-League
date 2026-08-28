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

  // Determine available regular season weeks
  const maxFixtureWeek = fixtures.length > 0
    ? Math.max(...fixtures.filter(f => !f.isPlayoff).map(f => f.weekNumber), 1)
    : (season.totalWeeks ? Math.max(1, season.totalWeeks - 2) : 15);
  
  const regularWeeksCount = maxFixtureWeek;
  const weekTabs = Array.from({ length: regularWeeksCount }, (_, i) => i + 1);

  const semifinalWeek = regularWeeksCount + 1;
  const championshipWeek = regularWeeksCount + 2;

  const filteredFixtures = fixtures.filter(f => f.seasonId === season.id && f.weekNumber === selectedWeek);
  const matchesPerWeekCount = filteredFixtures.length || (fixtures.length > 0 ? Math.round(fixtures.length / Math.max(1, regularWeeksCount)) : 5);

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
            {season.name} &bull; {regularWeeksCount} Regular Season Weeks &bull; {matchesPerWeekCount} Matches per week
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('settings')}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Adjust Season Length
          </button>
          {fixtures.length > 0 && (
            <button
              onClick={() => setSelectedWeek(season.currentWeek)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-2"
            >
              <span>Jump to Active (Week {season.currentWeek})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {fixtures.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm text-slate-600 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 text-2xl">
            📅
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No League Schedule Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You currently have {teams.length} teams registered. Go to League Settings to configure your desired season length and generate your round-robin schedule.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => onNavigate('teams')}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Manage Teams ({teams.length})
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              Configure Season & Generate Schedule
            </button>
          </div>
        </div>
      ) : (
        <>
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

            {/* Playoff Semifinal Tab */}
            <button
              onClick={() => setSelectedWeek(semifinalWeek)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 border ${
                selectedWeek === semifinalWeek
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Week {semifinalWeek} Semifinals</span>
            </button>

            {/* Championship Tab */}
            <button
              onClick={() => setSelectedWeek(championshipWeek)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 border ${
                selectedWeek === championshipWeek
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Week {championshipWeek} Championship</span>
            </button>
          </div>

          {/* Fixtures List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-semibold text-slate-800">
                {selectedWeek === semifinalWeek
                  ? `Week ${semifinalWeek} Postseason (Semifinals & Consolation Matches)`
                  : selectedWeek === championshipWeek
                  ? `Week ${championshipWeek} Championship Match`
                  : `Week ${selectedWeek} Regular Season Fixtures (${filteredFixtures.length} Matches)`}
              </span>
              <span>Click any card to open score entry</span>
            </div>

            {filteredFixtures.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm space-y-2">
                <p>No fixtures scheduled for Week {selectedWeek}.</p>
                {selectedWeek >= semifinalWeek && (
                  <p className="text-xs text-amber-600 font-medium">
                    Playoff matches will automatically generate when the regular season (Week {regularWeeksCount}) is finalized!
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
        </>
      )}
    </div>
  );
};


