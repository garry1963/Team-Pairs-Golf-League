import React, { useState } from 'react';
import { Calendar, Flag, Edit3, CheckCircle2, Trophy, ArrowRight, Check, Users, Clock, AlertCircle } from 'lucide-react';
import { Fixture, Season, Team, Course, TeamResult, Player } from '../../types';
import { DatabaseEngine } from '../../storage/db';

interface FixturesScreenProps {
  season: Season;
  fixtures: Fixture[];
  teams: Team[];
  players: Player[];
  courses: Course[];
  teamResults: TeamResult[];
  onSelectFixture: (fixtureId: number) => void;
  onNavigate: (screen: string) => void;
  onToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, msg: string) => void;
}

export const FixturesScreen: React.FC<FixturesScreenProps> = ({
  season,
  fixtures,
  teams,
  players,
  courses,
  teamResults,
  onSelectFixture,
  onNavigate,
  onToast
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(season.currentWeek);

  const teamMap = new Map<number, Team>();
  teams.forEach(t => teamMap.set(t.id, t));

  const playerMap = new Map<number, Player>();
  players.forEach(p => playerMap.set(p.id, p));

  const courseMap = new Map<number, Course>();
  courses.forEach(c => courseMap.set(c.id, c));

  const regularFixtures = fixtures.filter(f => f.seasonId === season.id && !f.isPlayoff);
  const maxFixtureWeek = regularFixtures.length > 0
    ? Math.max(...regularFixtures.map(f => f.weekNumber), 1)
    : (season.totalWeeks ? Math.max(1, season.totalWeeks - 2) : 15);

  const weekTabs = Array.from({ length: maxFixtureWeek }, (_, i) => i + 1);
  const currentWeekFixture = regularFixtures.find(f => f.weekNumber === selectedWeek) || regularFixtures[0];
  const currentCourse = courseMap.get(currentWeekFixture?.courseId || 1) || courses[0];

  const weekResults = currentWeekFixture
    ? teamResults.filter(r => r.fixtureId === currentWeekFixture.id)
    : [];

  const handleSetCourseForWeek = (newCourseId: number) => {
    if (!currentWeekFixture) return;
    const res = DatabaseEngine.updateFixtureCourse(currentWeekFixture.id, newCourseId);
    if (res.success) {
      if (onToast) onToast('success', 'Host Course Updated', res.message);
    } else {
      if (onToast) onToast('error', 'Update Failed', res.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Weekly Fixtures &amp; Rounds
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {season.name} &bull; All {teams.length} teams play each weekly round &bull; {maxFixtureWeek} Regular Season Weeks
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('courses')}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Flag className="w-3.5 h-3.5 text-blue-600" />
            <span>Course Library ({courses.length})</span>
          </button>
          <button
            onClick={() => onNavigate('score-entry')}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Score Entry Center</span>
          </button>
        </div>
      </div>

      {/* Week Selector Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 custom-scrollbar">
        {weekTabs.map(w => {
          const isCurrent = season.currentWeek === w;
          const isSelected = selectedWeek === w;
          const fix = regularFixtures.find(f => f.weekNumber === w);
          const isCompleted = fix?.status === 'COMPLETED';

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
              {isCompleted ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : isCurrent ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Week Round Information & Host Course Card */}
      {currentWeekFixture && (
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-bold text-slate-900">
                  Week {selectedWeek} Host Course:
                </span>
                <select
                  value={currentWeekFixture.courseId}
                  onChange={e => handleSetCourseForWeek(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.courseName} (Par {c.par}, {c.tees})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                <span>Par {currentCourse?.par || 72}</span>
                <span>&bull;</span>
                <span>{currentCourse?.tees || 'White Tees'}</span>
                {currentCourse?.location && (
                  <>
                    <span>&bull;</span>
                    <span>{currentCourse.location}</span>
                  </>
                )}
                <span>&bull;</span>
                <span>Scheduled: {currentWeekFixture.fixtureDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">
                {weekResults.length} / {teams.length} Teams Submitted
              </div>
              <div className="text-[11px] text-slate-500">
                {currentWeekFixture.status === 'COMPLETED' ? (
                  <span className="text-green-600 font-semibold">● Round Completed</span>
                ) : (
                  <span className="text-amber-600 font-semibold">● Open for Score Entry</span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                onSelectFixture(currentWeekFixture.id);
                onNavigate('score-entry');
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Enter / Edit Scores</span>
            </button>
          </div>
        </div>
      )}

      {/* Week Teams Grid: All Teams playing in Week X */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            <span>All Teams in Week {selectedWeek} Round ({teams.length} Teams)</span>
          </span>
          <span>Stableford Quota Scoring &bull; Click any team card to enter or review scores</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(t => {
            const res = currentWeekFixture
              ? teamResults.find(r => r.fixtureId === currentWeekFixture.id && r.teamId === t.id)
              : null;
            const pA = playerMap.get(t.playerAId);
            const pB = playerMap.get(t.playerBId);
            const isCompleted = !!res;

            return (
              <div
                key={t.id}
                onClick={() => {
                  if (currentWeekFixture) {
                    onSelectFixture(currentWeekFixture.id);
                    onNavigate('score-entry');
                  }
                }}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                        {t.teamName}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {pA?.displayName || 'Player A'} &amp; {pB?.displayName || 'Player B'}
                      </p>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                          SUBMITTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-3">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Team Points</span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {res ? res.teamPoints : '--'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Quota</span>
                      <span className="font-mono text-sm font-bold text-slate-700">
                        {res ? res.teamQuota : t.currentQuota}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Net Result</span>
                      {res ? (
                        <span className={`font-mono text-sm font-black ${
                          res.weeklyNetResult >= 0 ? 'text-green-600' : 'text-rose-600'
                        }`}>
                          {res.weeklyNetResult >= 0 ? `+${res.weeklyNetResult}` : res.weeklyNetResult}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">--</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-400">
                  <span>{currentCourse?.courseName || 'Host Course'}</span>
                  <span className="text-blue-600 font-semibold flex items-center space-x-1 group-hover:translate-x-0.5 transition">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'Edit Score' : 'Enter Score'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
