import React, { useState } from 'react';
import { Users, Plus, Edit2, Eye, Award, Search, Trophy, ArrowRight } from 'lucide-react';
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

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

  const filteredPlayers = players.filter(p =>
    p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      onToast('error', 'Validation Error', 'First name and last name are required.');
      return;
    }

    if (editingPlayer) {
      DatabaseEngine.updatePlayer(editingPlayer.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        handicap
      });
      onToast('success', 'Player Updated', `Updated details for ${firstName} ${lastName}.`);
      setEditingPlayer(null);
    } else {
      DatabaseEngine.addPlayer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        handicap,
        active: true
      });
      onToast('success', 'Player Added', `Added ${firstName} ${lastName} to the roster.`);
      setIsAddModalOpen(false);
    }

    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setHandicap(0);
  };

  const handleOpenEdit = (p: Player) => {
    setEditingPlayer(p);
    setFirstName(p.firstName);
    setLastName(p.lastName);
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setHandicap(p.handicap || 0);
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
            {players.length} Registered League Players &bull; Complete Scoring Histories & Performance Averages
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search player..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 w-52"
            />
          </div>

          <button
            onClick={() => {
              setEditingPlayer(null);
              setFirstName('');
              setLastName('');
              setEmail('');
              setPhone('');
              setHandicap(0);
              setIsAddModalOpen(true);
            }}
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
                <th className="py-3 px-4">Player Name</th>
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

                return (
                  <tr
                    key={player.id}
                    className="hover:bg-slate-50/80 transition group cursor-pointer"
                    onClick={() => onSelectPlayer(player.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                        {player.displayName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{player.email || 'No email registered'}</div>
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
              <h3 className="font-bold text-slate-900 text-base">
                {editingPlayer ? `Edit Player: ${editingPlayer.displayName}` : 'Add New League Player'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPlayer(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

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
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="player@pairsgolf.org"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
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
