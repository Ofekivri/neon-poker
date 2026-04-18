import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useGames } from '../hooks/useGames';
import { usePlayers } from '../hooks/usePlayers';
import { useAuthContext } from '../contexts/AuthContext';
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

interface GameRecord {
  gameId: string;
  date: string;
  net: number;
  buyInTotal: number;
  cashOut: number;
  playerCount: number;
}

interface H2HRecord {
  playerId: string;
  name: string;
  gamesPlayed: number;
  winsAgainst: number;
  lossesAgainst: number;
}

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { completedGames, loading } = useGames(user.uid);
  const { getPlayer, players } = usePlayers(user.uid);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="material-symbols-outlined text-red-600 text-5xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const player = playerId ? getPlayer(playerId) : undefined;
  if (!player) return <Navigate to="/players" replace />;

  // ── Compute all stats ──
  const gameRecords: GameRecord[] = [];
  let totalGames = 0;
  let wins = 0;
  let losses = 0;
  let totalNet = 0;
  let biggestWin = 0;
  let biggestLoss = 0;
  let totalBuyIns = 0;
  let totalBuyInCount = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let worstStreak = 0;
  let currentStreakType: 'win' | 'loss' | null = null;
  let tempWorstStreak = 0;

  // H2H tracking
  const h2hMap: Record<string, { gamesPlayed: number; winsAgainst: number; lossesAgainst: number }> = {};

  // Sort games by date (oldest first for streak calculation)
  const sortedGames = [...completedGames].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const game of sortedGames) {
    const gp = game.players.find((p) => p.playerId === playerId);
    if (!gp) continue;

    totalGames++;
    const balances = computeNetBalances(game.players);
    const myBalance = balances.find((b) => b.playerId === playerId);
    const net = myBalance?.net ?? 0;
    const buyInTotal = gp.buyIns.reduce((s, b) => s + b.amount, 0);
    const cashOut = gp.cashOut ?? 0;

    totalNet += net;
    totalBuyIns += buyInTotal;
    totalBuyInCount += gp.buyIns.length;

    if (net > 0) {
      wins++;
      biggestWin = Math.max(biggestWin, net);
      if (currentStreakType === 'win') {
        currentStreak++;
      } else {
        currentStreakType = 'win';
        currentStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      tempWorstStreak = 0;
    } else if (net < 0) {
      losses++;
      biggestLoss = Math.min(biggestLoss, net);
      if (currentStreakType === 'loss') {
        currentStreak++;
        tempWorstStreak++;
      } else {
        currentStreakType = 'loss';
        currentStreak = 1;
        tempWorstStreak = 1;
      }
      worstStreak = Math.max(worstStreak, tempWorstStreak);
    } else {
      currentStreakType = null;
      currentStreak = 0;
      tempWorstStreak = 0;
    }

    gameRecords.push({
      gameId: game.id,
      date: game.date,
      net,
      buyInTotal,
      cashOut,
      playerCount: game.players.length,
    });

    // H2H: for each other player in this game
    for (const otherBalance of balances) {
      if (otherBalance.playerId === playerId) continue;
      if (!h2hMap[otherBalance.playerId]) {
        h2hMap[otherBalance.playerId] = { gamesPlayed: 0, winsAgainst: 0, lossesAgainst: 0 };
      }
      h2hMap[otherBalance.playerId].gamesPlayed++;
      if (net > otherBalance.net) {
        h2hMap[otherBalance.playerId].winsAgainst++;
      } else if (net < otherBalance.net) {
        h2hMap[otherBalance.playerId].lossesAgainst++;
      }
    }
  }

  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const avgBuyIn = totalBuyInCount > 0 ? Math.round(totalBuyIns / totalBuyInCount) : 0;
  const avgNet = totalGames > 0 ? Math.round(totalNet / totalGames) : 0;
  const breakEven = totalGames - wins - losses;

  // Build H2H list
  const h2hRecords: H2HRecord[] = Object.entries(h2hMap)
    .map(([pid, data]) => ({
      playerId: pid,
      name: getPlayer(pid)?.name ?? 'Unknown',
      ...data,
    }))
    .filter((r) => r.gamesPlayed >= 1)
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  // Game records in reverse chronological order
  const recentGames = [...gameRecords].reverse();

  const initials = player.name.slice(0, 2).toUpperCase();
  const isPositive = totalNet >= 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate('/players')}
        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
      >
        <Icon name="arrow_back" className="text-lg" />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Players</span>
      </button>

      {/* Player Header */}
      <header className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
        <div
          className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-xl font-black ${
            isPositive
              ? 'border-red-700 text-red-500 bg-red-700/10'
              : 'border-zinc-600 text-zinc-400 bg-zinc-800'
          }`}
        >
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">{player.name}</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            Member since {new Date(player.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Net P/L</p>
          <p className={`text-2xl font-black ${isPositive ? 'text-emerald-400' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}₪{Math.abs(totalNet).toLocaleString()}
          </p>
        </div>
      </header>

      {/* Key Stats Grid */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard icon="casino" label="Games Played" value={totalGames.toString()} color="text-red-500" />
        <StatCard icon="percent" label="Win Rate" value={`${winRate}%`} color="text-yellow-500" />
        <StatCard icon="trending_up" label="Biggest Win" value={biggestWin > 0 ? `+₪${biggestWin.toLocaleString()}` : '-'} color="text-emerald-400" />
        <StatCard icon="trending_down" label="Biggest Loss" value={biggestLoss < 0 ? `-₪${Math.abs(biggestLoss).toLocaleString()}` : '-'} color="text-red-400" />
        <StatCard icon="payments" label="Avg Buy-In" value={`₪${avgBuyIn}`} color="text-blue-400" />
        <StatCard icon="analytics" label="Avg P/L per Game" value={`${avgNet >= 0 ? '+' : ''}₪${Math.abs(avgNet)}`} color={avgNet >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <StatCard icon="local_fire_department" label="Best Win Streak" value={bestStreak > 0 ? `${bestStreak} games` : '-'} color="text-orange-400" />
        <StatCard
          icon="balance"
          label="W / L / T"
          value={`${wins} / ${losses} / ${breakEven}`}
          color="text-zinc-300"
        />
      </section>

      {/* Head-to-Head Records */}
      {h2hRecords.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-black text-red-600 uppercase tracking-widest px-1">Head-to-Head</h2>
          <div className="bg-[#1b1b1b] rounded-2xl overflow-hidden border border-[#353535]">
            <div className="divide-y divide-[#353535]">
              {h2hRecords.map((h2h) => {
                const winPct = h2h.gamesPlayed > 0 ? Math.round((h2h.winsAgainst / h2h.gamesPlayed) * 100) : 0;
                return (
                  <div
                    key={h2h.playerId}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#222]"
                    onClick={() => navigate(`/player/${h2h.playerId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <span className="text-[10px] font-black text-zinc-400 uppercase">
                          {h2h.name.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm uppercase">{h2h.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {h2h.gamesPlayed} games together
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-black text-zinc-300">
                          <span className="text-emerald-400">{h2h.winsAgainst}W</span>
                          {' - '}
                          <span className="text-red-400">{h2h.lossesAgainst}L</span>
                        </p>
                        <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${winPct}%` }}
                          />
                        </div>
                      </div>
                      <Icon name="chevron_right" className="text-zinc-600 text-lg" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Game History */}
      <section className="space-y-3">
        <h2 className="text-xs font-black text-red-600 uppercase tracking-widest px-1">Game History</h2>
        {recentGames.length === 0 ? (
          <div className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm font-bold uppercase">No games yet</p>
          </div>
        ) : (
          <div className="bg-[#1b1b1b] rounded-2xl overflow-hidden border border-[#353535]">
            <div className="divide-y divide-[#353535]">
              {recentGames.map((gr, idx) => {
                const isWin = gr.net > 0;
                const dateStr = new Date(gr.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#222]"
                    onClick={() => navigate(`/game/${gr.gameId}/summary`)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isWin
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : gr.net < 0
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-zinc-800 border border-zinc-700'
                        }`}
                      >
                        <Icon
                          name={isWin ? 'arrow_upward' : gr.net < 0 ? 'arrow_downward' : 'remove'}
                          className={`text-sm ${isWin ? 'text-emerald-400' : gr.net < 0 ? 'text-red-400' : 'text-zinc-500'}`}
                        />
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{dateStr}</p>
                        <p className="text-[10px] text-zinc-500">
                          {gr.playerCount} players · Buy-in ₪{gr.buyInTotal}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-black text-sm ${
                          isWin ? 'text-emerald-400' : gr.net < 0 ? 'text-red-400' : 'text-zinc-400'
                        }`}
                      >
                        {isWin ? '+' : ''}₪{Math.abs(gr.net).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        Cash: ₪{gr.cashOut}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon name={icon} className={`text-lg ${color}`} />
        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{label}</p>
      </div>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}
