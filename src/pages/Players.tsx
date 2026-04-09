import { useState } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useGames } from '../hooks/useGames';
import { computeNetBalances } from '../utils/settlement';

function Icon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

export default function Players() {
  const { players, addPlayer, updatePlayer, deletePlayer } = usePlayers();
  const { completedGames } = useGames();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [search, setSearch] = useState('');

  // Compute per-player stats from completed games
  const playerStats: Record<string, { net: number; games: number; wins: number }> = {};
  for (const game of completedGames) {
    const balances = computeNetBalances(game.players);
    for (const b of balances) {
      if (!playerStats[b.playerId]) playerStats[b.playerId] = { net: 0, games: 0, wins: 0 };
      playerStats[b.playerId].net += b.net;
      playerStats[b.playerId].games += 1;
      if (b.net > 0) playerStats[b.playerId].wins += 1;
    }
  }

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addPlayer(trimmed);
    setNewName('');
  };

  const startEdit = (id: string, name: string) => {
    setEditId(id);
    setEditName(name);
  };

  const saveEdit = () => {
    if (editId && editName.trim()) {
      updatePlayer(editId, editName.trim());
    }
    setEditId(null);
  };

  const cancelEdit = () => setEditId(null);

  // Avatar border color based on name
  const avatarStyle = (name: string, net: number) => {
    if (net > 0) return 'border-red-700 text-red-500 bg-red-700/10';
    const colors = [
      'border-orange-500 text-orange-500 bg-orange-500/10',
      'border-blue-500 text-blue-500 bg-blue-500/10',
      'border-purple-500 text-purple-500 bg-purple-500/10',
      'border-cyan-500 text-cyan-500 bg-cyan-500/10',
      'border-pink-500 text-pink-500 bg-pink-500/10',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Stats for bento grid
  const totalWinners = Object.values(playerStats).filter((s) => s.net > 0).length;
  const totalWhales = Object.values(playerStats).filter((s) => s.games >= 5).length;
  const activePlayers = Object.keys(playerStats).length;
  const participationRate = players.length > 0 ? Math.round((activePlayers / players.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Search & Add Section */}
      <section className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="text-zinc-500 text-xl" />
          </div>
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 bg-[#1f1f1f] border-none rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-700 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-[#2a2a2a] rounded-xl">
          <input
            type="text"
            placeholder="ADD NEW PLAYER"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-grow bg-transparent border-none py-3 px-3 text-white font-bold placeholder-zinc-500 focus:ring-0 outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="bg-red-700 disabled:opacity-40 text-white w-12 h-12 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Icon name="add" className="font-bold" />
          </button>
        </div>
      </section>

      {/* Player List */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-black tracking-widest text-zinc-500 uppercase">Registered Sharks</h2>
          <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400">
            Total: {players.length}
          </span>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm font-bold uppercase">
              {players.length === 0 ? 'No players yet' : 'No results found'}
            </p>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const stats = playerStats[player.id] || { net: 0, games: 0, wins: 0 };
            const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;
            const initials = player.name.slice(0, 2).toUpperCase();
            const isEditing = editId === player.id;

            return (
              <div
                key={player.id}
                className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-4 flex items-center gap-4 active:bg-[#2a2a2a] transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                    stats.games === 0
                      ? 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      : avatarStyle(player.name, stats.net)
                  }`}
                >
                  <span className="font-black">{initials}</span>
                </div>

                {isEditing ? (
                  <div className="flex-grow flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1 bg-zinc-800 rounded-lg px-3 py-1.5 text-white text-sm font-bold focus:outline-none focus:ring-1 focus:ring-red-600 border-none"
                    />
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300 p-1">
                      <Icon name="check" className="text-lg" />
                    </button>
                    <button onClick={cancelEdit} className="text-zinc-400 hover:text-zinc-300 p-1">
                      <Icon name="close" className="text-lg" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-grow">
                      <h3 className="font-bold text-white">{player.name}</h3>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-tight">
                          Games: {stats.games}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-tight">
                          Win Rate: {winRate}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span
                        className={`font-bold tracking-tight ${
                          stats.net >= 0 ? 'text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        {stats.net >= 0 ? '+' : ''}₪{Math.abs(stats.net).toLocaleString()}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(player.id, player.name)}
                          className="text-zinc-600 hover:text-zinc-400"
                        >
                          <Icon name="edit" className="text-lg" />
                        </button>
                        <button
                          onClick={() => deletePlayer(player.id)}
                          className="text-zinc-600 hover:text-red-400"
                        >
                          <Icon name="delete" className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Stats Overview Bento Grid */}
      <section className="grid grid-cols-2 gap-3 mt-8 pb-8">
        <div className="col-span-2 bg-gradient-to-br from-red-600/20 to-zinc-900 border border-red-500/20 rounded-2xl p-4">
          <p className="text-[10px] text-red-500 uppercase font-black tracking-widest mb-1">Roster Health</p>
          <h4 className="text-2xl font-black text-white">Active Field</h4>
          <div className="mt-4 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-600" style={{ width: `${participationRate}%` }} />
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">
            {participationRate}% of players participated in completed games
          </p>
        </div>
        <div className="bg-[#1f1f1f] rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Winners</p>
          <p className="text-xl font-black text-emerald-400 mt-1">{totalWinners}</p>
        </div>
        <div className="bg-[#1f1f1f] rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Whales</p>
          <p className="text-xl font-black text-orange-500 mt-1">{totalWhales}</p>
        </div>
      </section>
    </div>
  );
}
