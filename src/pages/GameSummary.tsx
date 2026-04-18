import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useGames } from '../hooks/useGames';
import { usePlayers } from '../hooks/usePlayers';
import { useAuthContext } from '../contexts/AuthContext';
import { computeNetBalances } from '../utils/settlement';
import { shekelToChips } from '../utils/chips';

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

export default function GameSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { getGame, loading } = useGames(user.uid);
  const { getPlayer } = usePlayers(user.uid);

  const game = id ? getGame(id) : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined text-red-600 text-5xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!game) return <Navigate to="/" replace />;
  if (game.status === 'active') return <Navigate to={`/game/${id}`} replace />;

  const netBalances = computeNetBalances(game.players);
  const ranked = [...netBalances].sort((a, b) => b.net - a.net);

  const totalBuyIns = game.players.reduce(
    (s, gp) => s + gp.buyIns.reduce((ss, b) => ss + b.amount, 0), 0
  );
  const totalCashOut = game.players.reduce(
    (s, gp) => s + (gp.cashOut ?? 0), 0
  );

  const isBalanced = Math.abs(totalBuyIns - totalCashOut) < 1;

  const getPlayerName = (pid: string) => getPlayer(pid)?.name ?? 'Unknown';
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8 -mx-6 -mt-24">
      {/* Top App Bar Override */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-black border-b border-red-900/50 shadow-[0_4px_20px_rgba(255,0,0,0.1)]">
        <div className="flex items-center gap-3">
          <span
            onClick={() => navigate('/')}
            className="material-symbols-outlined text-red-600 hover:bg-red-950/30 transition-colors p-2 rounded-full active:scale-95 duration-150 cursor-pointer"
          >
            arrow_back
          </span>
          <h1 className="font-black text-red-600 uppercase tracking-widest text-xl">
            Session Settlement
          </h1>
        </div>
        <span
          onClick={() => navigate('/')}
          className="material-symbols-outlined text-red-600 hover:bg-red-950/30 transition-colors p-2 rounded-full active:scale-95 duration-150 cursor-pointer"
        >
          check
        </span>
      </nav>

      <main className="mt-20 px-4 space-y-8">
        {/* Header Section */}
        <header className="flex items-center justify-between bg-[#1f1f1f] p-6 rounded-xl border-l-4 border-red-700">
          <div>
            <h2 className="text-2xl font-black text-white leading-none mb-1">GAME SUMMARY</h2>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Final Calculations</p>
          </div>
          <div className="bg-red-700/20 p-3 rounded-full">
            <Icon name="check_circle" className="text-red-700 text-4xl" fill />
          </div>
        </header>

        {/* Player Cash-out Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest px-2">Player Cash-out</h3>
          <div className="bg-[#1b1b1b] rounded-2xl overflow-hidden border border-[#353535]">
            <div className="divide-y divide-[#353535]">
              {ranked.map(({ playerId, net }) => {
                const gp = game.players.find((p) => p.playerId === playerId)!;
                const cashOut = gp.cashOut ?? 0;
                const name = getPlayerName(playerId);
                const isWinner = net > 0;

                return (
                  <div key={playerId} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-black border-2 flex items-center justify-center font-black text-sm ${
                          isWinner
                            ? 'border-red-700 text-red-500'
                            : 'border-zinc-700 text-zinc-400'
                        }`}
                      >
                        {getInitials(name)}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm uppercase">{name}</p>
                        <p
                          className="text-[10px] font-bold"
                          style={{ color: isWinner ? '#22c55e' : '#ef4444' }}
                        >
                          {isWinner ? '+' : ''}₪{Math.abs(net).toFixed(0)}
                          {game.chipRate && (
                            <span className="text-zinc-500 ml-1">({shekelToChips(Math.abs(net), game.chipRate).toLocaleString()} chips)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-zinc-500 uppercase font-black mb-0.5">FINAL CASH</p>
                      <p className="font-black text-xl" style={{ color: '#facc15' }}>
                        {cashOut}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pot Audit Bar */}
            <div className="bg-black p-4 flex items-center justify-between border-t border-red-900/30">
              <div className="flex gap-4 text-[10px] font-black uppercase text-zinc-500">
                <span>
                  Buy-ins: <span className="text-white">₪{totalBuyIns.toLocaleString()}</span>
                </span>
                <span>
                  Cash-out: <span className="text-white">₪{totalCashOut.toLocaleString()}</span>
                </span>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  isBalanced
                    ? 'bg-yellow-400/10 text-yellow-400'
                    : 'bg-red-500/10 text-red-500'
                }`}
              >
                <Icon name={isBalanced ? 'verified' : 'error'} className="!text-xs" />
                {isBalanced ? 'Balanced' : 'Unbalanced'}
              </div>
            </div>
          </div>
        </section>

        {/* Debt Settlement Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest px-2">DEBT SETTLEMENT</h3>
          <div className="grid grid-cols-1 gap-3">
            {game.settlements && game.settlements.length > 0 ? (
              game.settlements.map((s, idx) => {
                const fromName = getPlayerName(s.fromPlayerId);
                const toName = getPlayerName(s.toPlayerId);
                return (
                  <div
                    key={idx}
                    className="bg-[#2a2a2a] p-4 rounded-xl flex items-center justify-between border border-[#353535] shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-white uppercase">{fromName}</span>
                      <Icon name="arrow_forward" className="text-red-700" />
                      <span className="font-black text-white uppercase">{toName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-black px-4 py-2 rounded-lg border border-red-900/30 text-center">
                        <span className="font-black text-lg" style={{ color: '#facc15' }}>
                          ₪{s.amount}
                        </span>
                        {game.chipRate && (
                          <p className="text-zinc-500 text-[9px] font-bold">{shekelToChips(s.amount, game.chipRate).toLocaleString()} chips</p>
                        )}
                      </div>
                      <Icon name="share" className="text-zinc-500 text-sm cursor-pointer hover:text-white" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#353535] text-center">
                <p className="text-zinc-500 text-sm font-bold uppercase">No settlements needed</p>
              </div>
            )}
          </div>
        </section>

        {/* Final Actions */}
        <section className="space-y-4 pt-4 pb-8">
          <button className="w-full flex items-center justify-center gap-3 bg-zinc-800 border border-zinc-700 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm hover:bg-zinc-700 transition-colors">
            <Icon name="chat" className="text-green-500" />
            Share Summary
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-3 bg-red-700 text-white font-black py-5 rounded-2xl uppercase tracking-[0.15em] text-lg shadow-xl shadow-red-900/40 hover:bg-red-800 active:scale-[0.97] transition-all"
          >
            <Icon name="save" />
            Close Session & Save to History
          </button>
        </section>
      </main>
    </div>
  );
}
