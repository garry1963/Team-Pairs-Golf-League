import React, { useState } from 'react';
import {
  Users, Plus, Edit2, Lock, Unlock, ArrowRight,
  ShieldAlert, Trash2, ArrowRightLeft, UserPlus, AlertTriangle, Check, X
} from 'lucide-react';
import { Team, Player, Season } from '../../types';
import { DatabaseEngine } from '../../storage/db';

interface TeamsScreenProps {
  season: Season;
  teams: Team[];
  players: Player[];
  onSelectTeam: (teamId: number) => void;
  onToast: (type: 'success' | 'error' | 'warning', title: string, msg: string) => void;
}

export const TeamsScreen: React.FC<TeamsScreenProps> = ({
  season,
  teams,
  players,
  onSelectTeam,
  onToast
}) => {
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [quotaModalTeam, setQuotaModalTeam] = useState<Team | null>(null);
  const [newQuotaVal, setNewQuotaVal] = useState<string>('');
  const [quotaReason, setQuotaReason] = useState<string>('');
  const [superAdminOverride, setSuperAdminOverride] = useState<boolean>(false);

  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newPlayerAId, setNewPlayerAId] = useState<number>(players[0]?.id || 1);
  const [newPlayerBId, setNewPlayerBId] = useState<number>(players[1]?.id || 2);
  const [newTeamQuota, setNewTeamQuota] = useState<number>(60);

  // Replace Player Modal State
  const [replaceModalTeam, setReplaceModalTeam] = useState<Team | null>(null);
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
  const [removeModalTeam, setRemoveModalTeam] = useState<Team | null>(null);
  const [removeReason, setRemoveReason] = useState<string>('');

  const playerMap = new Map<number, Player>();
  players.forEach(p => playerMap.set(p.id, p));

  const seasonTeams = teams.filter(t => t.seasonId === season.id);

  // Map each player to their currently assigned team
  const playerAssignmentMap = new Map<number, Team>();
  seasonTeams.forEach(t => {
    playerAssignmentMap.set(t.playerAId, t);
    playerAssignmentMap.set(t.playerBId, t);
  });

  const handleOpenQuotaModal = (team: Team) => {
    setQuotaModalTeam(team);
    setNewQuotaVal(String(team.currentQuota));
    setQuotaReason('');
    setSuperAdminOverride(false);
  };

  const handleSaveQuota = () => {
    if (!quotaModalTeam) return;
    const quotaNum = parseInt(newQuotaVal, 10);
    if (isNaN(quotaNum) || quotaNum < 30 || quotaNum > 100) {
      onToast('error', 'Invalid Quota', 'Quota must be a realistic number between 30 and 100.');
      return;
    }

    const res = DatabaseEngine.updateTeamQuota(
      quotaModalTeam.id,
      quotaNum,
      quotaReason || 'Manual quota adjustment',
      superAdminOverride
    );

    if (res.success) {
      onToast('success', 'Quota Updated', res.message);
      setQuotaModalTeam(null);
    } else {
      onToast('error', 'Quota Protected', res.message);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      onToast('error', 'Validation Error', 'Team name is required.');
      return;
    }
    if (newPlayerAId === newPlayerBId) {
      onToast('error', 'Validation Error', 'Player A and Player B cannot be the same person.');
      return;
    }

    try {
      const created = DatabaseEngine.addTeam({
        seasonId: season.id,
        teamName: newTeamName.trim(),
        playerAId: newPlayerAId,
        playerBId: newPlayerBId,
        currentQuota: newTeamQuota,
        active: true
      });
      onToast('success', 'Team Created', `Team "${created.teamName}" added successfully.`);
      setIsAddTeamModalOpen(false);
      setNewTeamName('');
    } catch (e: any) {
      onToast('error', 'Error', e.message);
    }
  };

  // Open Replace Modal
  const handleOpenReplaceModal = (team: Team, slot: 'playerA' | 'playerB' = 'playerA') => {
    setReplaceModalTeam(team);
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
    // Find first player not on this team
    const candidate = players.find(p => p.id !== otherSlotId && p.id !== currentSlotId);
    setSelectedReplacementPlayerId(candidate ? candidate.id : '');
  };

  const handleConfirmReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceModalTeam) return;

    let targetPlayerId: number;

    if (replaceSourceTab === 'new_player') {
      if (!newPlayerFirstName.trim()) {
        onToast('error', 'Validation Error', 'First name or nickname is required to create a replacement player.');
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
        onToast('error', 'Validation Error', 'Please select a replacement player from the roster.');
        return;
      }
      targetPlayerId = Number(selectedReplacementPlayerId);
    }

    const quotaNum = replaceNewQuota.trim() ? parseInt(replaceNewQuota, 10) : undefined;
    const res = DatabaseEngine.replaceTeamPlayer(
      replaceModalTeam.id,
      replaceSlot,
      targetPlayerId,
      quotaNum,
      replaceReason.trim() || undefined
    );

    if (res.success) {
      onToast('success', 'Player Replaced', res.message);
      setReplaceModalTeam(null);
    } else {
      onToast('error', 'Replacement Error', res.message);
    }
  };

  // Remove Team Handler
  const handleConfirmRemoveTeam = () => {
    if (!removeModalTeam) return;
    const res = DatabaseEngine.removeTeam(removeModalTeam.id, removeReason.trim() || undefined);
    if (res.success) {
      onToast('success', 'Team Removed', res.message);
      setRemoveModalTeam(null);
    } else {
      onToast('error', 'Error Removing Team', res.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Team & Pairs Quota Management
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {season.name} &bull; {seasonTeams.length} Registered Teams &bull; Manage Pairs, Rosters, and Quotas
          </p>
        </div>

        <button
          onClick={() => setIsAddTeamModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Pair</span>
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {seasonTeams.map((team, idx) => {
          const pA = playerMap.get(team.playerAId);
          const pB = playerMap.get(team.playerBId);

          return (
            <div
              key={team.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between group"
            >
              {/* Top Banner */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                      {team.teamName}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {team.quotaLocked ? (
                      <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Lock className="w-3 h-3 text-amber-600" /> <span>LOCKED</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <Unlock className="w-3 h-3 text-blue-600" /> <span>ACTIVE</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Players Roster with Quick Replace Options */}
                <div className="space-y-2 py-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 group/player">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Player A</span>
                      <span className="text-slate-900 font-bold">{pA?.displayName || 'Player A'}</span>
                      <span className="text-[10px] text-slate-500 font-medium ml-1.5">HCP {pA?.handicap ?? 'N/A'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenReplaceModal(team, 'playerA')}
                      className="px-2 py-1 rounded bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 text-[10px] font-semibold transition flex items-center space-x-1 shadow-2xs"
                      title="Replace Player A"
                    >
                      <ArrowRightLeft className="w-2.5 h-2.5" />
                      <span>Replace</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 group/player">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Player B</span>
                      <span className="text-slate-900 font-bold">{pB?.displayName || 'Player B'}</span>
                      <span className="text-[10px] text-slate-500 font-medium ml-1.5">HCP {pB?.handicap ?? 'N/A'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenReplaceModal(team, 'playerB')}
                      className="px-2 py-1 rounded bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 text-[10px] font-semibold transition flex items-center space-x-1 shadow-2xs"
                      title="Replace Player B"
                    >
                      <ArrowRightLeft className="w-2.5 h-2.5" />
                      <span>Replace</span>
                    </button>
                  </div>
                </div>

                {/* Quotas */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Current Quota</span>
                    <span className="font-mono text-base font-bold text-blue-700">
                      {team.currentQuota}
                    </span>
                  </div>
                  {team.playoffQuota && (
                    <div className="text-right">
                      <span className="text-[10px] text-amber-700 block font-semibold">Playoff Quota</span>
                      <span className="font-mono text-base font-bold text-amber-700">
                        {team.playoffQuota} 🔒
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between space-x-2">
                  <button
                    onClick={() => handleOpenReplaceModal(team, 'playerA')}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 hover:border-blue-200 transition flex items-center justify-center space-x-1.5 shadow-2xs"
                    title="Remove a player and replace with someone from the roster"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                    <span>Replace Player</span>
                  </button>

                  <button
                    onClick={() => handleOpenQuotaModal(team)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center space-x-1 shadow-2xs"
                    title="Change Quota"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    <span>Quota</span>
                  </button>

                  <button
                    onClick={() => onSelectTeam(team.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center space-x-1 shadow-2xs"
                  >
                    <span>Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove Team Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveModalTeam(team);
                      setRemoveReason('');
                    }}
                    className="text-[11px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition flex items-center space-x-1"
                    title={`Remove ${team.teamName} from the league`}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Team</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Replace Player Modal */}
      {replaceModalTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form onSubmit={handleConfirmReplace} className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Replace Player &bull; {replaceModalTeam.teamName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Remove a player from this team and substitute with a player from the roster.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplaceModalTeam(null)}
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
                      const candidate = players.find(p => p.id !== replaceModalTeam.playerBId && p.id !== replaceModalTeam.playerAId);
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
                      {playerMap.get(replaceModalTeam.playerAId)?.displayName || 'Player A'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      HCP {playerMap.get(replaceModalTeam.playerAId)?.handicap ?? 'N/A'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReplaceSlot('playerB');
                      const candidate = players.find(p => p.id !== replaceModalTeam.playerAId && p.id !== replaceModalTeam.playerBId);
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
                      {playerMap.get(replaceModalTeam.playerBId)?.displayName || 'Player B'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      HCP {playerMap.get(replaceModalTeam.playerBId)?.handicap ?? 'N/A'}
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
                          const partnerId = replaceSlot === 'playerA' ? replaceModalTeam.playerBId : replaceModalTeam.playerAId;
                          return p.id !== partnerId;
                        })
                        .map(p => {
                          const assignedTeam = playerAssignmentMap.get(p.id);
                          const isCurrent = p.id === (replaceSlot === 'playerA' ? replaceModalTeam.playerAId : replaceModalTeam.playerBId);
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
                          placeholder="e.g. Rory"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
                        <input
                          type="text"
                          value={newPlayerLastName}
                          onChange={e => setNewPlayerLastName(e.target.value)}
                          placeholder="e.g. McIlroy"
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
                          placeholder="e.g. The Rors"
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
                    Current: {replaceModalTeam.currentQuota}
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
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setReplaceModalTeam(null)}
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
      {removeModalTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl border border-rose-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Remove Team: {removeModalTeam.teamName}
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove this team from the league?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-2 leading-relaxed">
              <p className="font-semibold">This operation performs the following:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                <li>Removes <strong>{removeModalTeam.teamName}</strong> from active league standings and future rounds.</li>
                <li>Both registered players will remain in the player registry as free agents available for other teams.</li>
                <li>Associated match scores and results for this team will be removed from season standings.</li>
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
                onClick={() => setRemoveModalTeam(null)}
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

