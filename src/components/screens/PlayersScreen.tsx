import React, { useState } from 'react';
import { Users, Plus, Edit2, Eye, Award, Search, Trophy, ArrowRight, UserCheck, Sparkles, Tag } from 'lucide-react';
import { Player, Team, Season, PlayerScore } from '../../types';
import { DatabaseEngine } from '../../storage/db';

interface PlayersScreenProps {
  season: Season;
  players: Player[];
  teams: Team[];
  playerScores: PlayerScore[];
  onSelectPlayer: (playerId: number) => void;
  onToast: (type: 'success' | 'error' | 'warning', title: string, msg: string) => void;
}

export const PlayersScreen: React.FC<PlayersScreenProps> = ({
  season,
  players,
  teams,
  playerScores,
  onSelectPlayer,
  onToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form fields & entry mode
  const [nameMode, setNameMode] = useState<'fullname' | 'nickname'>('fullname');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [handicap, setHandicap] = useState<number>(0);

  const teamMap = new Map<number, Team>();
  teams.forEach(t => teamMap.set(t.id, t));

  // Find player's team
  const getPlayerTeam = (playerId: number): Team | undefined => {
    return teams.find(t => t.playerAId === playerId || t.playerBId === playerId);
  };

  // Compute stats per player
  const playerStatsMap = new Map<number, { rounds: number; avgPts: number; bestGross: number | null; dnfs: number }>();
  players.forEach(p => {
    const scores = playerScores.filter(s => s.playerId === p.id && s.scoreStatus !== 'PENDING');
    const validScores = scores.filter(s => s.grossScore !== null);
    const rounds = scores.length;
    const totalPts = scores.reduce((acc, s) => acc + s.leaguePoints, 0);
    const avgPts = rounds > 0 ? Number((totalPts / rounds).toFixed(1)) : 0;
    const bestGross = validScores.length > 0 ? Math.min(...validScores.map(s => s.grossScore!)) : null;
    const dnfs = scores.filter(s => s.scoreStatus === 'DNF').length;

    playerStatsMap.set(p.id, { rounds, avgPts, bestGross, dnfs });
  });

  const filteredPlayers = players.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.displayName.toLowerCase().includes(term) ||
      (p.nickname && p.nickname.toLowerCase().includes(term)) ||
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  });

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();

    let computedDisplayName = '';
    let finalFirstName = '';
    let finalLastName = '';
    let finalNickname: string | undefined = undefined;

    if (nameMode === 'nickname') {
      if (!nickname.trim()) {
        onToast('error', 'Validation Error', 'Please enter a player nickname or alias.');
        return;
      }
      computedDisplayName = nickname.trim();
      finalFirstName = nickname.trim();
      finalLastName = '';
      finalNickname = nickname.trim();
    } else {
      if (!firstName.trim()) {
        onToast('error', 'Validation Error', 'First name is required.');
        return;
      }
      finalFirstName = firstName.trim();
      finalLastName = lastName.trim();
      computedDisplayName = finalLastName ? `${finalFirstName} ${finalLastName}` : finalFirstName;
      finalNickname = nickname.trim() || undefined;
    }

    if (editingPlayer) {
      DatabaseEngine.updatePlayer(editingPlayer.id, {
        firstName: finalFirstName,
        lastName: finalLastName,
        nickname: finalNickname,
        displayName: computedDisplayName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        handicap
      });
      onToast('success', 'Player Updated', `Updated details for ${computedDisplayName}.`);
      setEditingPlayer(null);
    } else {
      DatabaseEngine.addPlayer({
        firstName: finalFirstName,
        lastName: finalLastName,
        nickname: finalNickname,
        displayName: computedDisplayName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        handicap,
        active: true
      });
      onToast('success', 'Player Registered', `Added ${computedDisplayName} to the player registry.`);
      setIsAddModalOpen(false);
    }

    // Reset fields
    setFirstName('');
    setLastName('');
    setNickname('');
    setEmail('');
    setPhone('');
    setHandicap(0);
    setNameMode('fullname');
  };

  const handleOpenEdit = (p: Player) => {
    setEditingPlayer(p);
    const isNickOnly = Boolean(p.nickname && (!p.lastName || p.firstName === p.nickname));
    setNameMode(isNickOnly ? 'nickname' : 'fullname');
    setFirstName(p.firstName);
    setLastName(p.lastName);
    setNickname(p.nickname || (isNickOnly ? p.displayName : ''));
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setHandicap(p.handicap || 0);
  };

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setNameMode('fullname');
    setFirstName('');
    setLastName('');
    setNickname('');
    setEmail('');
    setPhone('');
    setHandicap(0);
    setIsAddModalOpen(true);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Player Registry & Handicaps
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {players.length} Registered League Players &bull; Support for Full Names or Society Nicknames
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search player or nickname..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 w-56"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Player / Alias</th>
                <th className="py-3 px-4">Assigned Team</th>
                <th className="py-3 px-3 text-center">HCP</th>
                <th className="py-3 px-3 text-center">Rounds</th>
                <th className="py-3 px-3 text-center font-bold text-blue-700">Avg Points</th>
                <th className="py-3 px-3 text-center">Best Score</th>
                <th className="py-3 px-3 text-center">DNFs</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlayers.map(player => {
                const team = getPlayerTeam(player.id);
                const stats = playerStatsMap.get(player.id) || { rounds: 0, avgPts: 0, bestGross: null, dnfs: 0 };
                const isNickOnly = Boolean(player.nickname && (!player.lastName || player.firstName === player.nickname));

                return (
                  <tr
                    key={player.id}
                    className="hover:bg-slate-50/80 transition group cursor-pointer"
                    onClick={() => onSelectPlayer(player.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                          {player.displayName}
                        </span>
                        {player.nickname && !isNickOnly && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                            "{player.nickname}"
                          </span>
                        )}
                        {isNickOnly && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200">
                            Alias
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {player.email || (player.phone ? player.phone : 'No contact details registered')}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {team ? (
                        <span className="font-semibold text-slate-800">{team.teamName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned Free Agent</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                      {player.handicap ?? 0}
                    </td>

                    <td className="py-3 px-3 text-center text-slate-700 font-medium">
                      {stats.rounds}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                      {stats.avgPts} pts
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {stats.bestGross !== null ? stats.bestGross : '--'}
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {stats.dnfs > 0 ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">{stats.dnfs}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(player)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200 shadow-2xs"
                          title="Edit Player"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectPlayer(player.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition flex items-center space-x-1 shadow-2xs"
                        >
                          <span>Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Player Modal */}
      {(isAddModalOpen || editingPlayer) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form onSubmit={handleSavePlayer} className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingPlayer ? `Edit Player: ${editingPlayer.displayName}` : 'Add New League Player'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Register a player using First/Last Name or an alternative Nickname.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPlayer(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Entry Mode Switcher (First/Last vs Nickname Alternative) */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setNameMode('fullname')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition text-center ${
                  nameMode === 'fullname'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                First & Last Name
              </button>
              <button
                type="button"
                onClick={() => setNameMode('nickname')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition text-center ${
                  nameMode === 'nickname'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nickname / Alias Only
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Mode A: First & Last Name */}
              {nameMode === 'fullname' && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Garry"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Davies"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Nickname / Handle <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gazza"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Mode B: Nickname / Alias Only */}
              {nameMode === 'nickname' && (
                <div className="space-y-2 animate-in fade-in duration-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Player Nickname / Alias <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Tag className="w-4 h-4 text-blue-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Baz, Ace, Lefty, Big Dog"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-500 ring-1 ring-blue-500/20"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    💡 This player will appear across all scorecards, match fixtures, and team rosters by their nickname alone.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Official Handicap Index</label>
                <input
                  type="number"
                  step="0.1"
                  value={handicap}
                  onChange={e => setHandicap(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="player@pairsgolf.org"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+44 7700 900000"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPlayer(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
              >
                {editingPlayer ? 'Update Player' : 'Register Player'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

