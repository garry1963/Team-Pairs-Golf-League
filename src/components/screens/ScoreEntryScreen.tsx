import React, { useState, useEffect } from 'react';
import {
  Trophy, Flag, CheckCircle2, AlertTriangle, Clock,
  ArrowLeft, Save, Sparkles, Lock, ShieldAlert, Ban, RefreshCw, TrendingUp, Users, Check
} from 'lucide-react';
import { Fixture, Team, Player, Course, PlayerScore, TeamResult, Season } from '../../types';
import { ScoringService } from '../../engine/scoring';
import { DatabaseEngine } from '../../storage/db';
import { DeadlineService } from '../../engine/deadline';

interface ScoreEntryScreenProps {
  fixtureId?: number;
  season: Season;
  fixtures: Fixture[];
  teams: Team[];
  players: Player[];
  courses: Course[];
  playerScores: PlayerScore[];
  teamResults: TeamResult[];
  onBack: () => void;
  onScoreSaved: (msg: string) => void;
}

export const ScoreEntryScreen: React.FC<ScoreEntryScreenProps> = ({
  fixtureId,
  season,
  fixtures,
  teams,
  players,
  courses,
  playerScores,
  teamResults,
  onBack,
  onScoreSaved
}) => {
  const availableFixtures = fixtures.filter(f => f.seasonId === season.id && !f.isPlayoff);
  const initialWeek = fixtureId
    ? fixtures.find(f => f.id === fixtureId)?.weekNumber || season.currentWeek
    : season.currentWeek;

  const [selectedWeek, setSelectedWeek] = useState<number>(initialWeek);

  // Active fixture for the selected week
  const fixture = availableFixtures.find(f => f.weekNumber === selectedWeek) || availableFixtures[0];
  const course = courses.find(c => c.id === fixture?.courseId) || courses[0];

  // Active team selected for score entry
  const seasonTeams = teams.filter(t => t.seasonId === season.id && t.active);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(seasonTeams[0]?.id || 1);

  const selectedTeam = seasonTeams.find(t => t.id === selectedTeamId) || seasonTeams[0];
  const player1 = players.find(p => p.id === selectedTeam?.playerAId);
  const player2 = players.find(p => p.id === selectedTeam?.playerBId);

  // Existing scores for selected team and fixture
  const existingScore1 = playerScores.find(s => s.fixtureId === fixture?.id && s.playerId === player1?.id);
  const existingScore2 = playerScores.find(s => s.fixtureId === fixture?.id && s.playerId === player2?.id);
  const existingTeamResult = teamResults.find(r => r.fixtureId === fixture?.id && r.teamId === selectedTeam?.id);

  // Input states
  const [p1Gross, setP1Gross] = useState<string>('');
  const [p1Dnf, setP1Dnf] = useState<boolean>(false);
  const [p2Gross, setP2Gross] = useState<string>('');
  const [p2Dnf, setP2Dnf] = useState<boolean>(false);

  const [userReason, setUserReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync inputs whenever selectedTeam or fixture changes
  useEffect(() => {
    if (fixture && selectedTeam) {
      const score1 = playerScores.find(s => s.fixtureId === fixture.id && s.playerId === selectedTeam.playerAId);
      const score2 = playerScores.find(s => s.fixtureId === fixture.id && s.playerId === selectedTeam.playerBId);

      setP1Gross(score1?.grossScore !== null && score1?.grossScore !== undefined ? String(score1.grossScore) : '');
      setP1Dnf(score1?.scoreStatus === 'DNF');

      setP2Gross(score2?.grossScore !== null && score2?.grossScore !== undefined ? String(score2.grossScore) : '');
      setP2Dnf(score2?.scoreStatus === 'DNF');

      setErrorMessage(null);
    }
  }, [selectedWeek, selectedTeamId, fixture?.id, playerScores]);

  if (!fixture || seasonTeams.length === 0 || !course) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>No valid weekly fixtures or registered teams found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 rounded text-white text-xs font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Real-time calculation for selected team
  const quota = selectedTeam.quotaLocked && selectedTeam.playoffQuota ? selectedTeam.playoffQuota : selectedTeam.currentQuota;
  const parsed1 = p1Gross !== '' ? parseInt(p1Gross, 10) : null;
  const parsed2 = p2Gross !== '' ? parseInt(p2Gross, 10) : null;

  const calcP1 = ScoringService.calculatePlayerScore(p1Dnf ? null : parsed1, course.par, p1Dnf);
  const calcP2 = ScoringService.calculatePlayerScore(p2Dnf ? null : parsed2, course.par, p2Dnf);

  const liveTeamResult = ScoringService.calculateTeamResult(
    p1Dnf ? null : parsed1,
    p1Dnf,
    p2Dnf ? null : parsed2,
    p2Dnf,
    course.par,
    quota
  );

  const isDeadlinePassed = DeadlineService.isDeadlineExpired(fixture.deadline);

  // Submissions count for current week
  const weekTeamResults = teamResults.filter(r => r.fixtureId === fixture.id);
  const submittedCount = weekTeamResults.length;

  const handleSaveTeamScore = () => {
    setErrorMessage(null);

    const validateGross = (val: string, dnf: boolean, name: string) => {
      if (dnf) return true;
      if (val === '') {
        setErrorMessage(`Please enter a gross score for ${name}, or toggle DNF.`);
        return false;
      }
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 50 || num > 130) {
        setErrorMessage(`Invalid gross score for ${name}: Please enter a score between 50 and 130, or toggle DNF.`);
        return false;
      }
      return true;
    };

    if (!validateGross(p1Gross, p1Dnf, player1?.displayName || 'Player 1')) return;
    if (!validateGross(p2Gross, p2Dnf, player2?.displayName || 'Player 2')) return;

    const res = DatabaseEngine.saveTeamWeeklyScore(
      fixture.id,
      selectedTeam.id,
      {
        playerA1Gross: p1Dnf ? null : parsed1,
        playerA1Dnf: p1Dnf,
        playerA2Gross: p2Dnf ? null : parsed2,
        playerA2Dnf: p2Dnf
      },
      userReason || undefined
    );

    if (res.success) {
      onScoreSaved(res.message);
      setUserReason('');
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleCourseChange = (newCourseId: number) => {
    const res = DatabaseEngine.updateFixtureCourse(fixture.id, newCourseId);
    if (res.success) {
      onScoreSaved(`Host course updated to ${courses.find(c => c.id === newCourseId)?.courseName}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Return"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Weekly Score Entry Center
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {season.name} &bull; All teams play each weekly fixture &bull; Automated Stableford points & team quota comparison
          </p>
        </div>

        {/* Week Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-md custom-scrollbar">
          {availableFixtures.map(f => (
            <button
              key={f.weekNumber}
              onClick={() => setSelectedWeek(f.weekNumber)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                selectedWeek === f.weekNumber
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Week {f.weekNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Week Metadata & Host Course Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900">
                Week {selectedWeek} Round &bull; Host Course:
              </h2>
              <select
                value={course.id}
                onChange={e => handleCourseChange(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.courseName} (Par {c.par})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
              <span>Par {course.par}</span>
              <span>&bull;</span>
              <span>{course.tees}</span>
              {course.location && (
                <>
                  <span>&bull;</span>
                  <span>{course.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Week Completion Stats */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">
              {submittedCount} of {seasonTeams.length} Teams Submitted
            </div>
            <div className="text-[11px] text-slate-500">
              {fixture.status === 'COMPLETED' ? (
                <span className="text-green-600 font-semibold">● Week Round Completed</span>
              ) : (
                <span className="text-amber-600 font-semibold">● Round Open For Scores</span>
              )}
            </div>
          </div>
          <div className="w-24 bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${(submittedCount / Math.max(1, seasonTeams.length)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Team Selector List (Left) and Score Entry Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: League Teams List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">League Teams</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">{seasonTeams.length} Teams</span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
            {seasonTeams.map(t => {
              const res = weekTeamResults.find(r => r.teamId === t.id);
              const isSelected = t.id === selectedTeam.id;
              const pA = players.find(p => p.id === t.playerAId);
              const pB = players.find(p => p.id === t.playerBId);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                      <span>{t.teamName}</span>
                      {t.quotaLocked && <Lock className="w-3 h-3 text-amber-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {pA?.displayName || 'P1'} &bull; {pB?.displayName || 'P2'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Quota: {t.quotaLocked && t.playoffQuota ? t.playoffQuota : t.currentQuota}
                    </div>
                  </div>

                  <div className="text-right">
                    {res ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        res.weeklyNetResult >= 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {res.weeklyNetResult >= 0 ? `+${res.weeklyNetResult}` : res.weeklyNetResult} Net
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Score Entry & Calculations Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Team Heading & Quota Target */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Score Entry for Week {selectedWeek}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedTeam.teamName}
                </h2>
                <p className="text-xs text-slate-500">
                  {player1?.displayName || 'Player 1'} &amp; {player2?.displayName || 'Player 2'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Team Quota</span>
                <div className="text-xl font-black text-slate-900 font-mono">
                  {quota} pts
                </div>
                <span className="text-[10px] text-slate-500">Target to break even</span>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Player 1 & Player 2 Score Input Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Player 1 Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Player 1</span>
                    <h4 className="font-bold text-slate-900 text-sm">{player1?.displayName || 'Player 1'}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                    HC: {player1?.handicap ?? '--'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      18-Hole Gross Score (Par {course.par})
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        disabled={p1Dnf}
                        value={p1Gross}
                        onChange={e => setP1Gross(e.target.value)}
                        placeholder="e.g. 72"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm font-mono font-bold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setP1Dnf(!p1Dnf);
                          if (!p1Dnf) setP1Gross('');
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
                          p1Dnf
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>DNF</span>
                      </button>
                    </div>
                  </div>

                  {/* Player 1 Points Preview */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Relative to Par</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {p1Dnf ? 'DNF (+13)' : calcP1.relativeToPar !== null ? `${calcP1.relativeToPar >= 0 ? `+${calcP1.relativeToPar}` : calcP1.relativeToPar}` : '--'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">League Points</span>
                      <span className="font-bold text-blue-700 font-mono text-sm">
                        {calcP1.leaguePoints} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Player 2</span>
                    <h4 className="font-bold text-slate-900 text-sm">{player2?.displayName || 'Player 2'}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                    HC: {player2?.handicap ?? '--'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      18-Hole Gross Score (Par {course.par})
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        disabled={p2Dnf}
                        value={p2Gross}
                        onChange={e => setP2Gross(e.target.value)}
                        placeholder="e.g. 74"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm font-mono font-bold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setP2Dnf(!p2Dnf);
                          if (!p2Dnf) setP2Gross('');
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
                          p2Dnf
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>DNF</span>
                      </button>
                    </div>
                  </div>

                  {/* Player 2 Points Preview */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Relative to Par</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {p2Dnf ? 'DNF (+13)' : calcP2.relativeToPar !== null ? `${calcP2.relativeToPar >= 0 ? `+${calcP2.relativeToPar}` : calcP2.relativeToPar}` : '--'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">League Points</span>
                      <span className="font-bold text-blue-700 font-mono text-sm">
                        {calcP2.leaguePoints} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Team Calculations & Net Outcome Banner */}
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    Live Team Net Calculation
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {player1?.displayName?.split(' ')[0]} ({calcP1.leaguePoints} pts) + {player2?.displayName?.split(' ')[0]} ({calcP2.leaguePoints} pts)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Team Points Total</span>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {liveTeamResult.teamPoints}
                  </div>
                  <span className="text-[10px] text-slate-400">Sum of both players</span>
                </div>

                <div className="border-x border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Quota Target</span>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                    {quota}
                  </div>
                  <span className="text-[10px] text-slate-400">Current team quota</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Weekly Net Result</span>
                  <div className={`text-2xl font-black font-mono mt-0.5 ${
                    liveTeamResult.weeklyNetResult >= 0 ? 'text-green-400' : 'text-rose-400'
                  }`}>
                    {liveTeamResult.weeklyNetResult >= 0 ? `+${liveTeamResult.weeklyNetResult}` : liveTeamResult.weeklyNetResult}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {liveTeamResult.weeklyNetResult >= 0 ? 'Added to season points' : 'Subtracted from season points'}
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Audit Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrative Notes / Correction Reason (Optional)
              </label>
              <input
                type="text"
                value={userReason}
                onChange={e => setUserReason(e.target.value)}
                placeholder="e.g. Official scorecard signed off at scorer's hut"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel &amp; Back
              </button>

              <button
                type="button"
                onClick={handleSaveTeamScore}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Team Weekly Score</span>
              </button>
            </div>
          </div>

          {/* Full Week Scoreboard Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Week {selectedWeek} Complete Scoreboard ({weekTeamResults.length} / {seasonTeams.length} Submitted)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3 text-center">P1 Pts</th>
                    <th className="py-2.5 px-3 text-center">P2 Pts</th>
                    <th className="py-2.5 px-3 text-center font-bold">Team Pts</th>
                    <th className="py-2.5 px-3 text-center">Quota</th>
                    <th className="py-2.5 px-3 text-center font-bold">Weekly Net</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seasonTeams.map(t => {
                    const res = weekTeamResults.find(r => r.teamId === t.id);
                    const isCurrent = t.id === selectedTeam.id;

                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-slate-50 transition cursor-pointer ${
                          isCurrent ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => setSelectedTeamId(t.id)}
                      >
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <div>{t.teamName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                          {res ? res.playerAPoints : '--'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                          {res ? res.playerBPoints : '--'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-900">
                          {res ? res.teamPoints : '--'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {res ? res.teamQuota : t.currentQuota}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {res ? (
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              res.weeklyNetResult >= 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {res.weeklyNetResult >= 0 ? `+${res.weeklyNetResult}` : res.weeklyNetResult}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Pending</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeamId(t.id);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] font-semibold text-slate-700 transition"
                          >
                            {res ? 'Edit Score' : 'Enter'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
