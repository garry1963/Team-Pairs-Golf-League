import React, { useState, useEffect } from 'react';
import {
  Trophy, Flag, CheckCircle2, AlertTriangle, Clock,
  ArrowLeft, Save, Sparkles, Lock, ShieldAlert, Ban, RefreshCw
} from 'lucide-react';
import { Fixture, Team, Player, Course, PlayerScore, TeamResult, Season } from '../../types';
import { ScoringService } from '../../engine/scoring';
import { TiebreakerService } from '../../engine/tiebreaker';
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
  // Select active or specified fixture
  const availableFixtures = fixtures.filter(f => f.seasonId === season.id);
  const [selectedFixtureId, setSelectedFixtureId] = useState<number>(
    fixtureId || availableFixtures.find(f => f.weekNumber === season.currentWeek)?.id || availableFixtures[0]?.id || 1
  );

  const fixture = availableFixtures.find(f => f.id === selectedFixtureId) || availableFixtures[0];
  const course = courses.find(c => c.id === fixture?.courseId) || courses[0];
  const teamA = teams.find(t => t.id === fixture?.teamAId);
  const teamB = teams.find(t => t.id === fixture?.teamBId);

  const playerA1 = players.find(p => p.id === teamA?.playerAId);
  const playerA2 = players.find(p => p.id === teamA?.playerBId);
  const playerB1 = players.find(p => p.id === teamB?.playerAId);
  const playerB2 = players.find(p => p.id === teamB?.playerBId);

  // Existing scores
  const scoreA1 = playerScores.find(s => s.fixtureId === fixture?.id && s.playerId === playerA1?.id);
  const scoreA2 = playerScores.find(s => s.fixtureId === fixture?.id && s.playerId === playerA2?.id);
  const scoreB1 = playerScores.find(s => s.fixtureId === fixture?.id && s.playerId === playerB1?.id);
  const scoreB2 = playerScores.find(s => s.fixtureId === fixture?.id && s.playerId === playerB2?.id);

  // Form State
  const [a1Gross, setA1Gross] = useState<string>('');
  const [a1Dnf, setA1Dnf] = useState<boolean>(false);

  const [a2Gross, setA2Gross] = useState<string>('');
  const [a2Dnf, setA2Dnf] = useState<boolean>(false);

  const [b1Gross, setB1Gross] = useState<string>('');
  const [b1Dnf, setB1Dnf] = useState<boolean>(false);

  const [b2Gross, setB2Gross] = useState<string>('');
  const [b2Dnf, setB2Dnf] = useState<boolean>(false);

  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load scores on fixture change
  useEffect(() => {
    if (fixture) {
      setA1Gross(scoreA1?.grossScore !== null && scoreA1?.grossScore !== undefined ? String(scoreA1.grossScore) : '');
      setA1Dnf(scoreA1?.scoreStatus === 'DNF');

      setA2Gross(scoreA2?.grossScore !== null && scoreA2?.grossScore !== undefined ? String(scoreA2.grossScore) : '');
      setA2Dnf(scoreA2?.scoreStatus === 'DNF');

      setB1Gross(scoreB1?.grossScore !== null && scoreB1?.grossScore !== undefined ? String(scoreB1.grossScore) : '');
      setB1Dnf(scoreB1?.scoreStatus === 'DNF');

      setB2Gross(scoreB2?.grossScore !== null && scoreB2?.grossScore !== undefined ? String(scoreB2.grossScore) : '');
      setB2Dnf(scoreB2?.scoreStatus === 'DNF');

      setErrorMessage(null);
    }
  }, [selectedFixtureId, fixture?.id]);

  if (!fixture || !teamA || !teamB || !course) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>No valid fixture selected.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-emerald-800 rounded text-white text-xs">
          Return to Schedule
        </button>
      </div>
    );
  }

  // Real-time calculations
  const quotaA = (teamA.quotaLocked && teamA.playoffQuota) ? teamA.playoffQuota : teamA.currentQuota;
  const quotaB = (teamB.quotaLocked && teamB.playoffQuota) ? teamB.playoffQuota : teamB.currentQuota;

  const parsedA1 = a1Gross !== '' ? parseInt(a1Gross, 10) : null;
  const parsedA2 = a2Gross !== '' ? parseInt(a2Gross, 10) : null;
  const parsedB1 = b1Gross !== '' ? parseInt(b1Gross, 10) : null;
  const parsedB2 = b2Gross !== '' ? parseInt(b2Gross, 10) : null;

  const calcA1 = ScoringService.calculatePlayerScore(a1Dnf ? null : parsedA1, course.par, a1Dnf);
  const calcA2 = ScoringService.calculatePlayerScore(a2Dnf ? null : parsedA2, course.par, a2Dnf);
  const calcB1 = ScoringService.calculatePlayerScore(b1Dnf ? null : parsedB1, course.par, b1Dnf);
  const calcB2 = ScoringService.calculatePlayerScore(b2Dnf ? null : parsedB2, course.par, b2Dnf);

  const teamResA = ScoringService.calculateTeamResult(
    a1Dnf ? null : parsedA1,
    a1Dnf,
    a2Dnf ? null : parsedA2,
    a2Dnf,
    course.par,
    quotaA
  );

  const teamResB = ScoringService.calculateTeamResult(
    b1Dnf ? null : parsedB1,
    b1Dnf,
    b2Dnf ? null : parsedB2,
    b2Dnf,
    course.par,
    quotaB
  );

  const tiebreaker = TiebreakerService.resolveFixtureMatch(
    teamResA.weeklyNetResult,
    teamResA.lowestGrossScore,
    teamResA.secondGrossScore,
    teamResB.weeklyNetResult,
    teamResB.lowestGrossScore,
    teamResB.secondGrossScore
  );

  const isDeadlinePassed = DeadlineService.isDeadlineExpired(fixture.deadline);

  // Validation & Save Handler
  const handleSave = () => {
    setErrorMessage(null);

    // Validate inputs
    const validateGross = (val: string, dnf: boolean, name: string) => {
      if (dnf) return true;
      if (val === '') return false;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 50 || num > 130) {
        setErrorMessage(`Invalid score for ${name}: Please enter a realistic gross score between 50 and 130, or select DNF.`);
        return false;
      }
      return true;
    };

    if (!validateGross(a1Gross, a1Dnf, playerA1?.displayName || 'Player A1')) return;
    if (!validateGross(a2Gross, a2Dnf, playerA2?.displayName || 'Player A2')) return;
    if (!validateGross(b1Gross, b1Dnf, playerB1?.displayName || 'Player B1')) return;
    if (!validateGross(b2Gross, b2Dnf, playerB2?.displayName || 'Player B2')) return;

    const result = DatabaseEngine.saveFixtureScores(
      fixture.id,
      {
        playerA1Gross: a1Dnf ? null : parseInt(a1Gross, 10),
        playerA1Dnf: a1Dnf,
        playerA2Gross: a2Dnf ? null : parseInt(a2Gross, 10),
        playerA2Dnf: a2Dnf,
        playerB1Gross: b1Dnf ? null : parseInt(b1Gross, 10),
        playerB1Dnf: b1Dnf,
        playerB2Gross: b2Dnf ? null : parseInt(b2Gross, 10),
        playerB2Dnf: b2Dnf
      },
      correctionReason || undefined
    );

    if (result.success) {
      onScoreSaved(result.message);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Top Bar with Fixture Selector & Back */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
            title="Back to Fixtures"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {fixture.isPlayoff ? `${fixture.phase}` : `WEEK ${fixture.weekNumber}`}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Match #{fixture.id}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {teamA.teamName} <span className="text-blue-600 text-sm font-normal">vs</span> {teamB.teamName}
            </h1>
          </div>
        </div>

        {/* Fixture Picker */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedFixtureId}
            onChange={e => setSelectedFixtureId(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-2xs font-medium"
          >
            {availableFixtures.map(f => {
              const tA = teams.find(t => t.id === f.teamAId)?.teamName || 'Team A';
              const tB = teams.find(t => t.id === f.teamBId)?.teamName || 'Team B';
              return (
                <option key={f.id} value={f.id}>
                  {f.isPlayoff ? f.phase : `W${f.weekNumber}`}: {tA} vs {tB} ({f.status})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Course & Quota Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="text-slate-500 flex items-center space-x-1.5 mb-1">
            <Flag className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">Host Course:</span>
          </div>
          <div className="font-bold text-slate-900">{course.courseName}</div>
          <div className="text-[11px] text-blue-600 font-medium">Par {course.par} &bull; {course.tees}</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="text-slate-500 flex items-center space-x-1.5 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-700">Submission Deadline:</span>
          </div>
          <div className="font-bold text-slate-900">{new Date(fixture.deadline).toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">
            {isDeadlinePassed ? (
              <span className="text-amber-600 font-semibold">Deadline Expired (DNF Rule Applies)</span>
            ) : (
              <span className="text-green-600 font-medium">Active submission window</span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="text-slate-500 flex items-center space-x-1.5 mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-700">Team Quotas:</span>
          </div>
          <div className="font-bold text-slate-900 flex items-center justify-between">
            <span>{teamA.teamName}: <strong className="text-blue-600">{quotaA}</strong></span>
            <span>{teamB.teamName}: <strong className="text-blue-600">{quotaB}</strong></span>
          </div>
          <div className="text-[11px] text-slate-500">
            {teamA.quotaLocked ? '🔒 Quotas Locked for Playoffs' : 'Active Regular Season Quotas'}
          </div>
        </div>
      </div>

      {/* Error / Warning Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Two-Column Score Entry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TEAM A CARD */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {teamA.teamName}
              </h2>
              <p className="text-[11px] text-slate-500">
                Team Quota: <strong className="text-blue-600">{quotaA}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Live Team Points</span>
              <div className="font-mono text-xl font-bold text-blue-600">
                {teamResA.teamPoints}
              </div>
            </div>
          </div>

          {/* Player A1 Input */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-800">{playerA1?.displayName || 'Player A1'}</span>
              <button
                type="button"
                onClick={() => setA1Dnf(!a1Dnf)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  a1Dnf
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                {a1Dnf ? 'DNF (12 Pts)' : 'Mark DNF'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center pt-1">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Gross Score</label>
                <input
                  type="number"
                  disabled={a1Dnf}
                  value={a1Gross}
                  onChange={e => setA1Gross(e.target.value)}
                  placeholder={a1Dnf ? 'DNF' : 'e.g. 68'}
                  className={`w-full bg-white border text-slate-900 font-mono font-bold text-center text-sm py-1.5 rounded-lg focus:outline-none focus:border-blue-500 ${
                    a1Dnf ? 'opacity-40 border-slate-200' : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="text-center">
                <span className="text-[10px] text-slate-500 block mb-1">To Par</span>
                <span className="font-mono font-bold text-xs text-slate-700">
                  {calcA1.isDnf ? 'N/A' : (calcA1.relativeToPar !== null ? (calcA1.relativeToPar > 0 ? `+${calcA1.relativeToPar}` : calcA1.relativeToPar) : '--')}
                </span>
              </div>

              <div className="text-center bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                <span className="text-[10px] text-blue-700 block font-semibold">League Pts</span>
                <span className="font-mono font-bold text-sm text-blue-700">
                  {calcA1.leaguePoints}
                </span>
              </div>
            </div>
          </div>

          {/* Player A2 Input */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-800">{playerA2?.displayName || 'Player A2'}</span>
              <button
                type="button"
                onClick={() => setA2Dnf(!a2Dnf)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  a2Dnf
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                {a2Dnf ? 'DNF (12 Pts)' : 'Mark DNF'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center pt-1">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Gross Score</label>
                <input
                  type="number"
                  disabled={a2Dnf}
                  value={a2Gross}
                  onChange={e => setA2Gross(e.target.value)}
                  placeholder={a2Dnf ? 'DNF' : 'e.g. 65'}
                  className={`w-full bg-white border text-slate-900 font-mono font-bold text-center text-sm py-1.5 rounded-lg focus:outline-none focus:border-blue-500 ${
                    a2Dnf ? 'opacity-40 border-slate-200' : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="text-center">
                <span className="text-[10px] text-slate-500 block mb-1">To Par</span>
                <span className="font-mono font-bold text-xs text-slate-700">
                  {calcA2.isDnf ? 'N/A' : (calcA2.relativeToPar !== null ? (calcA2.relativeToPar > 0 ? `+${calcA2.relativeToPar}` : calcA2.relativeToPar) : '--')}
                </span>
              </div>

              <div className="text-center bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                <span className="text-[10px] text-blue-700 block font-semibold">League Pts</span>
                <span className="font-mono font-bold text-sm text-blue-700">
                  {calcA2.leaguePoints}
                </span>
              </div>
            </div>
          </div>

          {/* Team A Result Calculation Breakdown */}
          <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500">
              <span>{playerA1?.displayName || 'Player A1'} Points:</span>
              <span className="font-mono font-bold text-slate-800">{teamResA.playerAPoints}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{playerA2?.displayName || 'Player A2'} Points:</span>
              <span className="font-mono font-bold text-slate-800">{teamResA.playerBPoints}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200 pt-1">
              <span>Team Points Total:</span>
              <span className="font-mono font-bold text-blue-600">{teamResA.teamPoints}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Less Team Quota:</span>
              <span className="font-mono text-slate-500">-{quotaA}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200 pt-1.5">
              <span className="text-slate-900">Weekly Net Result:</span>
              <span className={`font-mono text-base ${teamResA.weeklyNetResult >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {teamResA.weeklyNetResult > 0 ? `+${teamResA.weeklyNetResult}` : teamResA.weeklyNetResult}
              </span>
            </div>
          </div>
        </div>

        {/* TEAM B CARD */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {teamB.teamName}
              </h2>
              <p className="text-[11px] text-slate-500">
                Team Quota: <strong className="text-blue-600">{quotaB}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Live Team Points</span>
              <div className="font-mono text-xl font-bold text-blue-600">
                {teamResB.teamPoints}
              </div>
            </div>
          </div>

          {/* Player B1 Input */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-800">{playerB1?.displayName || 'Player B1'}</span>
              <button
                type="button"
                onClick={() => setB1Dnf(!b1Dnf)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  b1Dnf
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                {b1Dnf ? 'DNF (12 Pts)' : 'Mark DNF'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center pt-1">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Gross Score</label>
                <input
                  type="number"
                  disabled={b1Dnf}
                  value={b1Gross}
                  onChange={e => setB1Gross(e.target.value)}
                  placeholder={b1Dnf ? 'DNF' : 'e.g. 70'}
                  className={`w-full bg-white border text-slate-900 font-mono font-bold text-center text-sm py-1.5 rounded-lg focus:outline-none focus:border-blue-500 ${
                    b1Dnf ? 'opacity-40 border-slate-200' : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="text-center">
                <span className="text-[10px] text-slate-500 block mb-1">To Par</span>
                <span className="font-mono font-bold text-xs text-slate-700">
                  {calcB1.isDnf ? 'N/A' : (calcB1.relativeToPar !== null ? (calcB1.relativeToPar > 0 ? `+${calcB1.relativeToPar}` : calcB1.relativeToPar) : '--')}
                </span>
              </div>

              <div className="text-center bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                <span className="text-[10px] text-blue-700 block font-semibold">League Pts</span>
                <span className="font-mono font-bold text-sm text-blue-700">
                  {calcB1.leaguePoints}
                </span>
              </div>
            </div>
          </div>

          {/* Player B2 Input */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-800">{playerB2?.displayName || 'Player B2'}</span>
              <button
                type="button"
                onClick={() => setB2Dnf(!b2Dnf)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  b2Dnf
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                {b2Dnf ? 'DNF (12 Pts)' : 'Mark DNF'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center pt-1">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Gross Score</label>
                <input
                  type="number"
                  disabled={b2Dnf}
                  value={b2Gross}
                  onChange={e => setB2Gross(e.target.value)}
                  placeholder={b2Dnf ? 'DNF' : 'e.g. 74'}
                  className={`w-full bg-white border text-slate-900 font-mono font-bold text-center text-sm py-1.5 rounded-lg focus:outline-none focus:border-blue-500 ${
                    b2Dnf ? 'opacity-40 border-slate-200' : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="text-center">
                <span className="text-[10px] text-slate-500 block mb-1">To Par</span>
                <span className="font-mono font-bold text-xs text-slate-700">
                  {calcB2.isDnf ? 'N/A' : (calcB2.relativeToPar !== null ? (calcB2.relativeToPar > 0 ? `+${calcB2.relativeToPar}` : calcB2.relativeToPar) : '--')}
                </span>
              </div>

              <div className="text-center bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                <span className="text-[10px] text-blue-700 block font-semibold">League Pts</span>
                <span className="font-mono font-bold text-sm text-blue-700">
                  {calcB2.leaguePoints}
                </span>
              </div>
            </div>
          </div>

          {/* Team B Result Calculation Breakdown */}
          <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500">
              <span>{playerB1?.displayName || 'Player B1'} Points:</span>
              <span className="font-mono font-bold text-slate-800">{teamResB.playerAPoints}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{playerB2?.displayName || 'Player B2'} Points:</span>
              <span className="font-mono font-bold text-slate-800">{teamResB.playerBPoints}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200 pt-1">
              <span>Team Points Total:</span>
              <span className="font-mono font-bold text-blue-600">{teamResB.teamPoints}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Less Team Quota:</span>
              <span className="font-mono text-slate-500">-{quotaB}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200 pt-1.5">
              <span className="text-slate-900">Weekly Net Result:</span>
              <span className={`font-mono text-base ${teamResB.weeklyNetResult >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {teamResB.weeklyNetResult > 0 ? `+${teamResB.weeklyNetResult}` : teamResB.weeklyNetResult}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Match Outcome & Tiebreaker Resolution Banner */}
      <div className="p-5 bg-blue-50/80 rounded-xl border border-blue-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Live Projected Match Outcome
            </h3>
          </div>
          <p className="text-xs text-blue-950 font-medium">
            {tiebreaker.explanation}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Recalculate Standings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
