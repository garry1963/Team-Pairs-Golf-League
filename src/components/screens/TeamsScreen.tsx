import React, { useState } from 'react';
import { Users, Plus, Edit2, Lock, Unlock, Eye, ArrowRight, ShieldAlert, Award } from 'lucide-react';
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

  const playerMap = new Map<number, Player>();
  players.forEach(p => playerMap.set(p.id, p));

  const seasonTeams = teams.filter(t => t.seasonId === season.id);

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
            {season.name} &bull; 10 Active Pairs &bull; Automated Weekly Quota Tracking & Week 15 Lock Protection
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

                {/* Players Roster */}
                <div className="space-y-2 py-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-800 font-semibold">{pA?.displayName || 'Player A'}</span>
                    <span className="text-[10px] text-slate-500 font-medium">HCP {pA?.handicap ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-800 font-semibold">{pB?.displayName || 'Player B'}</span>
                    <span className="text-[10px] text-slate-500 font-medium">HCP {pB?.handicap ?? 'N/A'}</span>
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
              <div className="flex items-center justify-between space-x-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenQuotaModal(team)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center space-x-1.5 shadow-2xs"
                >
                  <Edit2 className="w-3 h-3 text-slate-500" />
                  <span>Change Quota</span>
                </button>

                <button
                  onClick={() => onSelectTeam(team.id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center space-x-1 shadow-2xs"
                >
                  <span>Profile</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Change Quota Modal with Lock Protection */}
      {quotaModalTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Change Quota: {quotaModalTeam.teamName}
              </h3>
              <button onClick={() => setQuotaModalTeam(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {quotaModalTeam.quotaLocked && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                <div className="flex items-center space-x-2 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Quota Lock Active (Week 15 Rule)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Playoff quotas are permanently locked after Week 15. Standard quota edits are disabled. SuperAdmin override is required to alter a locked playoff quota.
                </p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Quota Target</label>
                <input
                  type="number"
                  value={newQuotaVal}
                  onChange={e => setNewQuotaVal(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Reason for Adjustment</label>
                <input
                  type="text"
                  value={quotaReason}
                  onChange={e => setQuotaReason(e.target.value)}
                  placeholder="e.g. Handicap revision or review committee ruling"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {quotaModalTeam.quotaLocked && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="override"
                    checked={superAdminOverride}
                    onChange={e => setSuperAdminOverride(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="override" className="text-amber-800 font-semibold text-[11px] cursor-pointer">
                    Enable SuperAdmin Postseason Override
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setQuotaModalTeam(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuota}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
              >
                Update Quota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {isAddTeamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form onSubmit={handleCreateTeam} className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Register New Pairs Team</h3>
              <button type="button" onClick={() => setIsAddTeamModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="e.g. Iron Masters"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Player A</label>
                  <select
                    value={newPlayerAId}
                    onChange={e => setNewPlayerAId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.displayName} (HCP {p.handicap ?? 'N/A'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Player B</label>
                  <select
                    value={newPlayerBId}
                    onChange={e => setNewPlayerBId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.displayName} (HCP {p.handicap ?? 'N/A'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Initial Team Quota</label>
                <input
                  type="number"
                  required
                  value={newTeamQuota}
                  onChange={e => setNewTeamQuota(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddTeamModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
              >
                Save Team
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
