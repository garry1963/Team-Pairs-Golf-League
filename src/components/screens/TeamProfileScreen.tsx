import React, { useState } from 'react';
import {
  Trophy, Users, Calendar, ArrowLeft, Lock, Unlock,
  TrendingUp, Award, Clock, ArrowUpRight, ArrowDownRight, Flag,
  ArrowRightLeft, Trash2, UserPlus, AlertTriangle, Check, X, Plus
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Team, Player, Fixture, TeamResult, StandingsRow, Season, Course } from '../../types';
import { DatabaseEngine } from '../../storage/db';

interface TeamProfileScreenProps {
  teamId: number;
  season: Season;
  teams: Team[];
  players: Player[];
  fixtures: Fixture[];
  teamResults: TeamResult[];
  standings: StandingsRow[];
  courses: Course[];
  onBack: () => void;
  onToast?: (type: 'success' | 'error' | 'warning', title: string, msg: string) => void;
}

export const TeamProfileScreen: React.FC<TeamProfileScreenProps> = ({
  teamId,
  season,
  teams,
  players,
  fixtures,
  teamResults,
  standings,
  courses,
  onBack,
  onToast
}) => {
  const team = teams.find(t => t.id === teamId);
  const playerA = players.find(p => p.id === team?.playerAId);
  const playerB = players.find(p => p.id === team?.playerBId);
  const standing = standings.find(s => s.teamId === teamId);

  // Replace Player Modal State
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState<boolean>(false);
  const [replaceSlot, setReplaceSlot] = useState<'playerA' | 'playerB'>('playerA');
  const [replaceSourceTab, setReplaceSourceTab] = useState<'roster' | 'new_player'>('roster');
  const [selectedReplacementPlayerId, setSelectedReplacementPlayerId] = useState<number | ''>('');
  const [replaceNewQuota, setReplaceNewQuota] = useState<string>('');
  const [replaceReason, setReplaceReason] = useState<string>('');
  const [newPlayerFirstName, setNewPlayerFirstName] = useState<string>('');
  const [newPlayerLastName, setNewPlayerLastName] = useState<string>('');
  const [newPlayerNickname, setNewPlayerNickname] = useState<string>('');
  const [newPlayerHandicap, setNewPlayerHandicap] = useState<number>(0);

  // Remove Team Modal State
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState<boolean>(false);
  const [removeReason, setRemoveReason] = useState<string>('');

  if (!team) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Team not found or has been removed.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs">
          Return to Teams
        </button>
      </div>
    );
  }

  const playerMap = new Map<number, Player>();
  players.forEach(p => playerMap.set(p.id, p));

  const seasonTeams = teams.filter(t => t.seasonId === season.id);
  const playerAssignmentMap = new Map<number, Team>();
  seasonTeams.forEach(t => {
    playerAssignmentMap.set(t.playerAId, t);
    playerAssignmentMap.set(t.playerBId, t);
  });

  const handleOpenReplaceModal = (slot: 'playerA' | 'playerB' = 'playerA') => {
    setReplaceSlot(slot);
    setReplaceSourceTab('roster');
    setReplaceReason('');
    setReplaceNewQuota(String(team.currentQuota));
    setNewPlayerFirstName('');
    setNewPlayerLastName('');
    setNewPlayerNickname('');
    setNewPlayerHandicap(0);

    const otherSlotId = slot === 'playerA' ? team.playerBId : team.playerAId;
    const currentSlotId = slot === 'playerA' ? team.playerAId : team.playerBId;
    const candidate = players.find(p => p.id !== otherSlotId && p.id !== currentSlotId);
    setSelectedReplacementPlayerId(candidate ? candidate.id : '');
    setIsReplaceModalOpen(true);
  };

  const handleConfirmReplace = (e: React.FormEvent) => {
    e.preventDefault();
    let targetPlayerId: number;

    if (replaceSourceTab === 'new_player') {
      if (!newPlayerFirstName.trim()) {
        onToast?.('error', 'Validation Error', 'First name is required.');
        return;
      }
      const displayName = newPlayerLastName.trim()
        ? `${newPlayerFirstName.trim()} ${newPlayerLastName.trim()}`
        : newPlayerFirstName.trim();

      const createdPlayer = DatabaseEngine.addPlayer({
        firstName: newPlayerFirstName.trim(),
        lastName: newPlayerLastName.trim(),
        nickname: newPlayerNickname.trim() || undefined,
        displayName,
        handicap: Number(newPlayerHandicap) || 0,
        active: true
      });
      targetPlayerId = createdPlayer.id;
    } else {
      if (!selectedReplacementPlayerId) {
        onToast?.('error', 'Validation Error', 'Please select a replacement player from the roster.');
        return;
      }
      targetPlayerId = Number(selectedReplacementPlayerId);
    }

    const quotaNum = replaceNewQuota.trim() ? parseInt(replaceNewQuota, 10) : undefined;
    const res = DatabaseEngine.replaceTeamPlayer(
      team.id,
      replaceSlot,
      targetPlayerId,
      quotaNum,
      replaceReason.trim() || undefined
    );

    if (res.success) {
      onToast?.('success', 'Player Replaced', res.message);
      setIsReplaceModalOpen(false);
    } else {
      onToast?.('error', 'Replacement Error', res.message);
    }
  };

  const handleConfirmRemoveTeam = () => {
    const res = DatabaseEngine.removeTeam(team.id, removeReason.trim() || undefined);
    if (res.success) {
      onToast?.('success', 'Team Removed', res.message);
      setIsRemoveModalOpen(false);
      onBack();
    } else {
      onToast?.('error', 'Removal Failed', res.message);
    }
  };

  // Get completed weekly results for this team
  const teamCompletedResults = teamResults
    .filter(tr => tr.teamId === team.id)
    .map(tr => {
      const fix = fixtures.find(f => f.id === tr.fixtureId);
      const course = courses.find(c => c.id === fix?.courseId);
      return {
        week: fix?.isPlayoff ? fix.phase : `W${fix?.weekNumber ?? 1}`,
        weekNum: fix?.weekNumber ?? 1,
        netResult: tr.weeklyNetResult,
        teamPoints: tr.teamPoints,
        quota: tr.teamQuota,
        result: tr.matchResult,
        courseName: course?.courseName || 'Links'
      };
    })
    .sort((a, b) => a.weekNum - b.weekNum);

  const netResultsArray = teamCompletedResults.map(r => r.netResult);
  const bestResult = netResultsArray.length > 0 ? Math.max(...netResultsArray) : 0;
  const worstResult = netResultsArray.length > 0 ? Math.min(...netResultsArray) : 0;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header & Position Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200"
            title="Back to Teams"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Rank #{standing?.position ?? 'N/A'} in Season
              </span>
              {team.quotaLocked ? (
                <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-2.5 h-2.5 text-amber-600" /> <span>Playoff Quota Locked</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Unlock className="w-2.5 h-2.5 text-blue-600" /> <span>Regular Season</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {team.teamName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {playerA?.displayName || 'Player A'} &bull; {playerB?.displayName || 'Player B'}
            </p>
          </div>
        </div>

        {/* Quota Highlights & Team Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center space-x-6">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Current Quota</span>
              <span className="font-mono text-2xl font-bold text-blue-700">{team.currentQuota}</span>
            </div>
            {team.playoffQuota && (
              <div className="border-l border-slate-200 pl-6">
                <span className="text-[10px] text-amber-700 block uppercase font-bold tracking-wider">Playoff Quota</span>
                <span className="font-mono text-2xl font-bold text-amber-700">{team.playoffQuota} 🔒</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenReplaceModal('playerA')}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>Replace Player</span>
            </button>

            <button
              onClick={() => {
                setRemoveReason('');
                setIsRemoveModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
              title="Delete this team"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* Team Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player A Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">Player A (Lead)</span>
            <h4 className="text-base font-bold text-slate-900">{playerA?.displayName || 'Player A'}</h4>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>Handicap: <strong className="text-slate-800">{playerA?.handicap ?? 'N/A'}</strong></span>
              {playerA?.nickname && <span>&bull; &ldquo;{playerA.nickname}&rdquo;</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenReplaceModal('playerA')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
          >
            <ArrowRightLeft className="w-3 h-3 text-blue-600" />
            <span>Replace</span>
          </button>
        </div>

        {/* Player B Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">Player B (Partner)</span>
            <h4 className="text-base font-bold text-slate-900">{playerB?.displayName || 'Player B'}</h4>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>Handicap: <strong className="text-slate-800">{playerB?.handicap ?? 'N/A'}</strong></span>
              {playerB?.nickname && <span>&bull; &ldquo;{playerB.nickname}&rdquo;</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenReplaceModal('playerB')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
          >
            <ArrowRightLeft className="w-3 h-3 text-blue-600" />
            <span>Replace</span>
          </button>
        </div>
      </div>

      {/* Season Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Played</span>
          <span className="text-lg font-bold text-slate-900 mt-0.5">{standing?.played ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-blue-700 block font-bold">Wins</span>
          <span className="text-lg font-bold text-blue-700 mt-0.5">{standing?.wins ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Draws</span>
          <span className="text-lg font-bold text-slate-700 mt-0.5">{standing?.draws ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-rose-600 block font-semibold">Losses</span>
          <span className="text-lg font-bold text-rose-600 mt-0.5">{standing?.losses ?? 0}</span>
        </div>
        <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-center shadow-2xs">
          <span className="text-[10px] text-blue-800 block font-bold">Season Pts</span>
          <span className="text-lg font-bold text-blue-800 mt-0.5">{standing?.seasonPoints ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Net Result</span>
          <span className="text-lg font-bold font-mono text-blue-700 mt-0.5">
            {standing && standing.totalNetResult > 0 ? `+${standing.totalNetResult}` : (standing?.totalNetResult ?? 0)}
          </span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Best Week</span>
          <span className="text-lg font-bold font-mono text-blue-700 mt-0.5">
            {bestResult > 0 ? `+${bestResult}` : bestResult}
          </span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-semibold">Worst Week</span>
          <span className="text-lg font-bold font-mono text-rose-600 mt-0.5">
            {worstResult > 0 ? `+${worstResult}` : worstResult}
          </span>
        </div>
      </div>

      {/* Interactive Trend Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">
              Weekly Net Result Progression
            </h2>
          </div>
          <span className="text-xs text-slate-500">Team Points minus Quota per week</span>
        </div>

        {teamCompletedResults.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamCompletedResults} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="netResult"
                  name="Net Result"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#2563eb' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No completed matches recorded yet for this team.
          </div>
        )}
      </div>

      {/* Match History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Weekly Match Log</h3>
          <span className="text-xs text-slate-500">{teamCompletedResults.length} Completed Rounds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Week</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-3 text-center">Team Pts</th>
                <th className="py-3 px-3 text-center">Quota</th>
                <th className="py-3 px-3 text-center font-bold text-blue-700">Weekly Net</th>
                <th className="py-3 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamCompletedResults.map((round, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{round.week}</td>
                  <td className="py-3 px-4 text-slate-700">{round.courseName}</td>
                  <td className="py-3 px-3 text-center font-mono font-medium">{round.teamPoints}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-500">{round.quota}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                    {round.netResult > 0 ? `+${round.netResult}` : round.netResult}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      round.result === 'WIN' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      round.result === 'DRAW' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {round.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replace Player Modal */}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form onSubmit={handleConfirmReplace} className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Replace Player &bull; {team.teamName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Remove a player from this team and substitute with a player from the roster.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Step 1: Choose Slot to Replace */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Select Player Being Removed
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReplaceSlot('playerA');
                      const candidate = players.find(p => p.id !== team.playerBId && p.id !== team.playerAId);
                      setSelectedReplacementPlayerId(candidate ? candidate.id : '');
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      replaceSlot === 'playerA'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-blue-700 uppercase block">Player A Slot</span>
                    <span className="font-bold text-sm block truncate">
                      {playerA?.displayName || 'Player A'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      HCP {playerA?.handicap ?? 'N/A'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReplaceSlot('playerB');
                      const candidate = players.find(p => p.id !== team.playerAId && p.id !== team.playerBId);
                      setSelectedReplacementPlayerId(candidate ? candidate.id : '');
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      replaceSlot === 'playerB'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-blue-700 uppercase block">Player B Slot</span>
                    <span className="font-bold text-sm block truncate">
                      {playerB?.displayName || 'Player B'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      HCP {playerB?.handicap ?? 'N/A'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 2: Choose Replacement Source */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Select Replacement Player
                  </label>
                  <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setReplaceSourceTab('roster')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        replaceSourceTab === 'roster' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      From Roster
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplaceSourceTab('new_player')}
                      className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 ${
                        replaceSourceTab === 'new_player' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Player</span>
                    </button>
                  </div>
                </div>

                {replaceSourceTab === 'roster' ? (
                  <div className="space-y-1.5">
                    <select
                      value={selectedReplacementPlayerId}
                      onChange={e => setSelectedReplacementPlayerId(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                    >
                      {players
                        .filter(p => {
                          const partnerId = replaceSlot === 'playerA' ? team.playerBId : team.playerAId;
                          return p.id !== partnerId;
                        })
                        .map(p => {
                          const assignedTeam = playerAssignmentMap.get(p.id);
                          const isCurrent = p.id === (replaceSlot === 'playerA' ? team.playerAId : team.playerBId);
                          let statusTag = 'Free Agent';
                          if (isCurrent) statusTag = 'Currently in this slot';
                          else if (assignedTeam) statusTag = `On ${assignedTeam.teamName}`;

                          return (
                            <option key={p.id} value={p.id} disabled={isCurrent}>
                              {p.displayName} (HCP {p.handicap ?? 'N/A'}) &bull; {statusTag}
                            </option>
                          );
                        })}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Selecting an existing player replaces the slot for upcoming fixtures and future scoring.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          value={newPlayerFirstName}
                          onChange={e => setNewPlayerFirstName(e.target.value)}
                          placeholder="e.g. Brooks"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
                        <input
                          type="text"
                          value={newPlayerLastName}
                          onChange={e => setNewPlayerLastName(e.target.value)}
                          placeholder="e.g. Koepka"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Nickname (Optional)</label>
                        <input
                          type="text"
                          value={newPlayerNickname}
                          onChange={e => setNewPlayerNickname(e.target.value)}
                          placeholder="e.g. Major Hunter"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Handicap</label>
                        <input
                          type="number"
                          value={newPlayerHandicap}
                          onChange={e => setNewPlayerHandicap(Number(e.target.value))}
                          placeholder="0"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Quota Adjustment Option */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Adjust Team Quota Target (Optional)
                  </label>
                  <span className="text-[11px] text-blue-700 font-bold">
                    Current: {team.currentQuota}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min={20}
                    max={120}
                    value={replaceNewQuota}
                    onChange={e => setReplaceNewQuota(e.target.value)}
                    className="w-28 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    Update quota if the replacement player's handicap alters the team's combined target.
                  </span>
                </div>
              </div>

              {/* Step 4: Audit Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Replacement / Audit Note
                </label>
                <input
                  type="text"
                  value={replaceReason}
                  onChange={e => setReplaceReason(e.target.value)}
                  placeholder="e.g. Medical substitution, partner availability, mid-season transfer"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Replacement</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Remove Team Confirmation Modal */}
      {isRemoveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl border border-rose-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Remove Team: {team.teamName}
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove this team from the league?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-2 leading-relaxed">
              <p className="font-semibold">This operation performs the following:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                <li>Removes <strong>{team.teamName}</strong> from active league standings and future rounds.</li>
                <li>Both registered players will remain in the player registry as free agents.</li>
                <li>Associated match scores and results for this team will be purged from season standings.</li>
              </ul>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold text-xs mb-1">
                Reason for Removal (Optional)
              </label>
              <input
                type="text"
                value={removeReason}
                onChange={e => setRemoveReason(e.target.value)}
                placeholder="e.g. Pair withdrew from league, schedule conflict"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRemoveModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveTeam}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete &amp; Remove Team</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
