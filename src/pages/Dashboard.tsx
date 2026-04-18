import { useNavigate } from 'react-router-dom';
import { useGames } from '../hooks/useGames';
import { usePlayers } from '../hooks/usePlayers';
import { computeNetBalances } from '../utils/settlement';
import { loadMockData, clearAllData } from '../utils/mockData';
import { useAuthContext } from '../contexts/AuthContext';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function Dashboard() {
  const { user } = useAuthContext();
  const { completedGames, activeGame } = useGames(user.uid);
  const { getPlayer } = usePlayers(user.uid);
  const navigate = useNavigate();

  // Build all-time leaderboard
  const netByPlayer: Record<string, { net: number; games: number }> = {};
  for (const game of completedGames) {
    const balances = computeNetBalances(game.players);
    for (const b of balances) {
      if (!netByPlayer[b.playerId]) netByPlayer[b.playerId] = { net: 0, games: 0 };
      netByPlayer[b.playerId].net += b.net;
      netByPlayer[b.playerId].games += 1;
    }
  }
  const leaderboard = Object.entries(netByPlayer)
    .map(([id, data]) => ({ player: getPlayer(id), ...data }))
    .filter((x) => x.player)
    .sort((a, b) => b.net - a.net);

  // Last game data
  const lastGame = completedGames[0];
  let lastGameWinner: { name: string; net: number } | null = null;
  let lastGamePot = 0;
  let lastGameDate = '';
  if (lastGame) {
    const balances = computeNetBalances(lastGame.players);
    const best = balances.sort((a, b) => b.net - a.net)[0];
    lastGameWinner = { name: getPlayer(best.playerId)?.name ?? 'Unknown', net: best.net };
    lastGamePot = lastGame.players.reduce(
      (s, gp) => s + gp.buyIns.reduce((ss, b) => ss + b.amount, 0), 0
    );
    lastGameDate = new Date(lastGame.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).toUpperCase();
  }

  // Recent settlement (from last game)
  const recentSettlements = lastGame?.settlements ?? [];

  // Avatar initials colors
  const avatarBg = (name: string) => {
    const colors = [
      'bg-orange-950/40 border-orange-600/30 text-orange-500',
      'bg-blue-950/40 border-blue-600/30 text-blue-500',
      'bg-purple-950/40 border-purple-600/30 text-purple-500',
      'bg-green-950/40 border-green-600/30 text-green-500',
      'bg-pink-950/40 border-pink-600/30 text-pink-500',
      'bg-cyan-950/40 border-cyan-600/30 text-cyan-500',
      'bg-red-950/40 border-red-900/30 text-red-500',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="space-y-8">
      {/* Dev tools */}
      <div className="flex gap-2">
        <button
          onClick={loadMockData}
          className="flex-1 text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-500 rounded-xl py-2 px-3 font-bold uppercase tracking-widest transition-colors"
        >
          Load Mock Data
        </button>
        <button
          onClick={clearAllData}
          className="flex-1 text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-500 rounded-xl py-2 px-3 font-bold uppercase tracking-widest transition-colors"
        >
          Clear All Data
        </button>
      </div>

      {/* Active game banner */}
      {activeGame && (
        <button
          onClick={() => navigate(`/game/${activeGame.id}`)}
          className="w-full rounded-2xl border-2 border-red-600/50 bg-red-950/10 p-6 flex items-center gap-4 text-left hover:bg-red-950/20 transition-all group"
        >
          <div className="p-3 rounded-full bg-red-600/10 border border-red-600/20">
            <Icon name="playing_cards" className="text-red-600 text-2xl" />
          </div>
          <div className="flex-1">
            <p className="text-red-500 font-black text-sm uppercase tracking-wider">Live Game in Progress</p>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              {activeGame.players.length} players · Pot:{' '}
              {activeGame.players.reduce((s, gp) => s + gp.buyIns.reduce((ss, b) => ss + b.amount, 0), 0)} ₪
            </p>
          </div>
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        </button>
      )}

      {/* Start New Game (Massive CTA) */}
      <section>
        <div className="group relative overflow-hidden rounded-3xl bg-zinc-900 border-2 border-zinc-800 p-10 flex flex-col items-center text-center space-y-8 hover:border-red-600/50 transition-all duration-300">
          <div className="absolute -right-20 -top-20 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon name="playing_cards" className="!text-[300px] text-red-600" />
          </div>
          <div>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">
              Start New Game
            </h2>
            <p className="text-zinc-400 text-lg max-w-md mx-auto">
              Launch a live tracking session for tonight's table and dominate the felt.
            </p>
          </div>
          <button
            onClick={() => navigate(activeGame ? `/game/${activeGame.id}` : '/game/new')}
            className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white px-10 py-6 rounded-2xl font-black text-2xl uppercase tracking-[0.2em] flex items-center justify-center gap-4 animate-pulse-glow transition-all active:scale-95 shadow-xl shadow-red-900/40"
          >
            <Icon name="add_circle" className="text-3xl" />
            {activeGame ? 'Resume' : 'New Session'}
          </button>
        </div>
      </section>

      {/* Register New Player */}
      <section className="flex justify-center">
        <button
          onClick={() => navigate('/players')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group px-4 py-2"
        >
          <Icon name="person_add" className="text-xl group-hover:text-red-500" />
          <span className="text-xs font-bold uppercase tracking-widest">Register New Shark</span>
        </button>
      </section>

      {/* Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leaderboard Preview */}
        <div className="md:col-span-2 glass-card rounded-2xl border border-zinc-800/50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xl uppercase tracking-tighter text-red-600">
              Leaderboard Preview
            </h3>
            <Icon name="trending_up" className="text-zinc-500 cursor-pointer hover:text-red-500" />
          </div>
          {leaderboard.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm font-bold uppercase tracking-widest py-8">
              No games yet
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {leaderboard.slice(0, 5).map(({ player, net, games }, idx) => (
                <div
                  key={player!.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/20 rounded-xl border border-zinc-800/40"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-xs w-4 ${idx === 0 ? 'text-red-600' : 'text-zinc-500'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${avatarBg(player!.name)}`}>
                      <span className="text-[10px] font-black uppercase">
                        {player!.name.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase text-xs tracking-wider">{player!.name}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">{games} Games</p>
                    </div>
                  </div>
                  <span className={`font-black text-sm ${net >= 0 ? 'text-profit-green' : 'text-red-500'}`}>
                    {net >= 0 ? '+' : ''}₪{Math.abs(net).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last Game */}
        <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl border border-zinc-800 p-6 flex flex-col">
          <h3 className="font-black text-xl uppercase tracking-tighter text-red-600 mb-6">Last Game</h3>
          {lastGame ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
              <div className="p-5 rounded-full bg-red-600/10 border border-red-600/20">
                <Icon name="history" className="text-red-600 text-3xl" />
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Session Data</p>
                <p className="text-sm font-black text-white uppercase leading-relaxed">
                  {lastGameDate} | Winner:{' '}
                  <span className="text-profit-green">
                    {lastGameWinner!.name} (+₪{lastGameWinner!.net})
                  </span>
                </p>
              </div>
              <div className="w-full border-t border-zinc-800 pt-4 mt-4">
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Pot</p>
                <p className="text-2xl font-black text-red-600">₪{lastGamePot.toLocaleString()}.00</p>
              </div>
              <button
                onClick={() => navigate(`/game/${lastGame.id}/summary`)}
                className="text-zinc-400 hover:text-white transition-colors text-[10px] font-bold uppercase underline decoration-red-600 underline-offset-4"
              >
                Full History
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 py-8">
              <div className="p-5 rounded-full bg-red-600/10 border border-red-600/20">
                <Icon name="history" className="text-red-600 text-3xl" />
              </div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">No games yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Settlement Summary */}
      {recentSettlements.length > 0 && (
        <section>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-zinc-500 mb-4">
              Recent Settlement Summary
            </h3>
            {recentSettlements.map((s, idx) => {
              const fromName = getPlayer(s.fromPlayerId)?.name ?? 'Unknown';
              const toName = getPlayer(s.toPlayerId)?.name ?? 'Unknown';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-1 border-b border-zinc-800/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${avatarBg(fromName).split(' ').slice(0, 1).join(' ')}`}>
                      <span className="text-[8px] font-black uppercase text-orange-500">
                        {fromName.slice(0, 2)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">
                      <span className="font-bold text-white uppercase">{fromName}</span>
                      {' pays '}
                      <span className="font-bold text-white uppercase">{toName}</span>
                    </p>
                  </div>
                  <p className="text-red-400 font-bold">₪{s.amount}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12">
        <button
          onClick={() => navigate('/')}
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors group"
        >
          <Icon name="analytics" className="text-zinc-500 group-hover:text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Stats</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors group"
        >
          <Icon name="trophy" className="text-zinc-500 group-hover:text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Seasons</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors group"
        >
          <Icon name="payments" className="text-zinc-500 group-hover:text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Ledger</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors group"
        >
          <Icon name="rule" className="text-zinc-500 group-hover:text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Rules</span>
        </button>
      </section>
    </div>
  );
}
