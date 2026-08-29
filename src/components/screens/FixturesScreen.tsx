import React, { useState } from 'react';
import { Calendar, Flag, Edit3, CheckCircle2, Trophy, ArrowRight, Check, Users, Clock, AlertCircle, CalendarDays, SlidersHorizontal, Sparkles, X } from 'lucide-react';
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
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState(fixtures[0]?.fixtureDate || new Date().toISOString().split('T')[0]);

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

  const handleSetDateForWeek = (fixtureId: number, weekNum: number, newDate: string) => {
    if (!newDate) return;
    const res = DatabaseEngine.updateWeekDate(season.id, weekNum, newDate);
    if (res.success) {
      if (onToast) onToast('success', `Week ${weekNum} Date Updated`, `Scheduled for ${newDate}.`);
    } else {
      if (onToast) onToast('error', 'Update Failed', res.message);
    }
  };

  const handleBulkAutoSpaceDates = () => {
    if (!bulkStartDate) return;
    try {
      const baseDate = new Date(bulkStartDate);
      regularFixtures.forEach((f, idx) => {
        const weekDateObj = new Date(baseDate.getTime() + (f.weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
        const formattedDate = weekDateObj.toISOString().split('T')[0];
        DatabaseEngine.updateWeekDate(season.id, f.weekNumber, formattedDate);
      });
      if (onToast) onToast('success', 'Schedule Auto-Spaced', `All ${regularFixtures.length} weekly fixture dates set starting from ${bulkStartDate} (spaced 7 days apart).`);
    } catch (e: any) {
      if (onToast) onToast('error', 'Auto-Schedule Error', e.message);
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition flex items-center space-x-1.5"
            title="Set and manage dates for all weekly fixtures"
          >
            <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
            <span>Manage All Fixture Dates</span>
          </button>
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

      {/* Week Round Information & Host Course & Fixture Date Card */}
      {currentWeekFixture && (
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-xl p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start md:items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 md:mt-0">
              <Flag className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">
                    Week {selectedWeek} Course:
                  </span>
                  <select
                    value={currentWeekFixture.courseId}
                    onChange={e => handleSetCourseForWeek(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.courseName} (Par {c.par}, {c.tees})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fixture Date Setter */}
                <div className="flex items-center space-x-2 bg-white/80 px-2.5 py-1 rounded-lg border border-blue-100 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Fixture Date:</span>
                  <input
                    type="date"
                    value={currentWeekFixture.fixtureDate}
                    onChange={e => handleSetDateForWeek(currentWeekFixture.id, currentWeekFixture.weekNumber, e.target.value)}
                    className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    title="Change scheduled date for this weekly fixture"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
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
                <span className="text-blue-700 font-medium">
                  Playing Date: <strong>{new Date(currentWeekFixture.fixtureDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end space-x-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200">
            <div className="text-left lg:text-right">
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

      {/* Schedule & All Fixture Dates Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-4xl w-full rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Weekly Fixtures &amp; Dates Schedule Manager
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set and customize the date and host course for each individual weekly fixture.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Auto-space shortcut */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Auto-Schedule All Weekly Rounds (7-Day Spacing)</span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Pick Season Start Date to automatically set all {regularFixtures.length} week dates weekly.
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <input
                    type="date"
                    value={bulkStartDate}
                    onChange={e => setBulkStartDate(e.target.value)}
                    className="bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    onClick={handleBulkAutoSpaceDates}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition whitespace-nowrap"
                  >
                    Apply to All Weeks
                  </button>
                </div>
              </div>

              {/* Table of all fixtures */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Week</th>
                      <th className="py-3 px-4">Scheduled Date</th>
                      <th className="py-3 px-4">Day / Formatted Date</th>
                      <th className="py-3 px-4">Host Course</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {regularFixtures.map(f => {
                      const courseObj = courseMap.get(f.courseId) || courses[0];
                      const dateObj = new Date(f.fixtureDate + 'T00:00:00');
                      const formattedDisplay = !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                        : f.fixtureDate;

                      return (
                        <tr key={f.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">Week {f.weekNumber}</span>
                            {f.weekNumber === season.currentWeek && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-700">
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={f.fixtureDate}
                              onChange={e => handleSetDateForWeek(f.id, f.weekNumber, e.target.value)}
                              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {formattedDisplay}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={f.courseId}
                              onChange={e => DatabaseEngine.updateFixtureCourse(f.id, Number(e.target.value))}
                              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                            >
                              {courses.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.courseName} (Par {c.par})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            {f.status === 'COMPLETED' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                COMPLETED
                              </span>
                            ) : f.status === 'IN_PROGRESS' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                IN PROGRESS
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                {f.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
