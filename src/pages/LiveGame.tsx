import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useGames } from '../hooks/useGames';
import { usePlayers } from '../hooks/usePlayers';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { calculateSettlements, computeNetBalances } from '../utils/settlement';
import { chipsToShekel, shekelToChips } from '../utils/chips';
import type { ChipRate } from '../types';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('00:00:00');
  useEffect(() => {
    const start = new Date(since).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);
  return <span className="text-xs font-bold font-mono">{elapsed}</span>;
}

/* ─── Buy-In Modal (Neon themed) ─── */
function BuyInModal({
  playerName,
  onConfirm,
  onClose,
}: {
  playerName: string;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(50);
  const adjust = (delta: number) => setAmount((prev) => Math.max(10, prev + delta));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-[60]">
      <div className="bg-zinc-900 border-t border-zinc-700 w-full max-w-lg rounded-t-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg uppercase tracking-tight">Buy-In: {playerName}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
          <button onClick={() => adjust(-10)} className="w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors border border-zinc-700">
            <Icon name="remove" />
          </button>
          <div className="text-center">
            <span className="text-4xl font-black text-white">{amount}</span>
            <span className="text-xl text-zinc-500 ml-1">₪</span>
          </div>
          <button onClick={() => adjust(10)} className="w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors border border-zinc-700">
            <Icon name="add" />
          </button>
        </div>
        <div className="flex gap-2 justify-center">
          {[20, 50, 100, 200].map((v) => (
            <button key={v} onClick={() => setAmount(v)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${amount === v ? 'bg-red-600 text-white' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'}`}>
              {v}₪
            </button>
          ))}
        </div>
        <button onClick={() => onConfirm(amount)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl py-4 transition-colors uppercase tracking-widest active:scale-95">
          Confirm Buy-In
        </button>
      </div>
    </div>
  );
}

/* ─── End Game / Cash-Out Modal (Neon themed) ─── */
function EndGameModal({
  players,
  getPlayerName,
  onAddBuyIn,
  onConfirm,
  onClose,
  chipRate,
}: {
  players: { playerId: string; buyIns: { amount: number }[] }[];
  getPlayerName: (id: string) => string;
  onAddBuyIn: (playerId: string, amount: number) => void;
  onConfirm: (cashOuts: Record<string, number>) => void;
  onClose: () => void;
  chipRate?: ChipRate;
}) {
  const [cashOuts, setCashOuts] = useState<Record<string, string>>(
    Object.fromEntries(players.map((p) => [p.playerId, '']))
  );
  const [chipCounts, setChipCounts] = useState<Record<string, string>>(
    Object.fromEntries(players.map((p) => [p.playerId, '']))
  );
  const [buyInOpen, setBuyInOpen] = useState<string | null>(null);
  const [buyInAmount, setBuyInAmount] = useState(50);

  const handleChipInput = (playerId: string, chips: string) => {
    setChipCounts(prev => ({ ...prev, [playerId]: chips }));
    if (chipRate && chips !== '') {
      const shekel = chipsToShekel(Number(chips), chipRate);
      setCashOuts(prev => ({ ...prev, [playerId]: String(shekel) }));
    }
  };

  const totalPot = players.reduce((s, gp) => s + gp.buyIns.reduce((ss, b) => ss + b.amount, 0), 0);
  const totalCashOut = Object.values(cashOuts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const diff = totalCashOut - totalPot;
  const balanced = Math.abs(diff) < 0.01;

  const handleConfirm = () => {
    const numeric = Object.fromEntries(Object.entries(cashOuts).map(([id, v]) => [id, parseFloat(v) || 0]));
    onConfirm(numeric);
  };

  const confirmBuyIn = (playerId: string) => {
    onAddBuyIn(playerId, buyInAmount);
    setBuyInOpen(null);
    setBuyInAmount(50);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-[60]">
      <div className="bg-zinc-900 border-t border-zinc-700 w-full max-w-lg rounded-t-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg uppercase tracking-tight">Cash Out</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <Icon name="close" />
          </button>
        </div>
        <p className="text-zinc-500 text-sm">Enter each player's final chip count.</p>

        <div className="space-y-3">
          {players.map((gp) => {
            const invested = gp.buyIns.reduce((s, b) => s + b.amount, 0);
            const isOpen = buyInOpen === gp.playerId;
            return (
              <div key={gp.playerId} className="bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-bold uppercase">{getPlayerName(gp.playerId)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs font-mono">{invested} ₪</span>
                    <button onClick={() => { setBuyInOpen(isOpen ? null : gp.playerId); setBuyInAmount(50); }}
                      className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 text-xs font-bold rounded-lg px-2 py-1 transition-colors">
                      <Icon name="add" className="!text-sm" /> Buy-in
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="bg-zinc-900 rounded-xl p-3 space-y-2 border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setBuyInAmount(v => Math.max(10, v - 10))} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700">
                        <Icon name="remove" className="!text-sm" />
                      </button>
                      <span className="flex-1 text-center text-white font-black text-lg">{buyInAmount} ₪</span>
                      <button onClick={() => setBuyInAmount(v => v + 10)} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700">
                        <Icon name="add" className="!text-sm" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setBuyInOpen(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg py-2">Cancel</button>
                      <button onClick={() => confirmBuyIn(gp.playerId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg py-2">Confirm</button>
                    </div>
                  </div>
                )}
                {chipRate && (
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" placeholder="Chips..."
                      value={chipCounts[gp.playerId]}
                      onChange={(e) => handleChipInput(gp.playerId, e.target.value)}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600 placeholder-zinc-600" />
                    <span className="text-zinc-500 text-sm">chips</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input type="number" min="0" placeholder="Cash out..."
                    value={cashOuts[gp.playerId]}
                    onChange={(e) => setCashOuts(prev => ({ ...prev, [gp.playerId]: e.target.value }))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600 placeholder-zinc-600" />
                  <span className="text-zinc-500 text-sm">₪</span>
                </div>
                {chipRate && cashOuts[gp.playerId] !== '' && chipCounts[gp.playerId] !== '' && (
                  <p className="text-xs text-zinc-500 font-mono">
                    {Number(chipCounts[gp.playerId]).toLocaleString()} chips = <span className="text-red-400 font-bold">{cashOuts[gp.playerId]}₪</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className={`rounded-xl px-4 py-3 flex items-center justify-between text-sm ${balanced ? 'bg-green-900/20 border border-green-800/40' : 'bg-red-900/20 border border-red-800/40'}`}>
          <span className={balanced ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {balanced ? '✓ Balanced' : diff > 0 ? `Over by ${diff.toFixed(0)} ₪` : `Under by ${Math.abs(diff).toFixed(0)} ₪`}
          </span>
          <span className="text-zinc-500 font-mono">{totalCashOut.toFixed(0)} / {totalPot} ₪</span>
        </div>

        <button onClick={handleConfirm} disabled={!balanced}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl py-4 transition-colors uppercase tracking-widest">
          Calculate Settlements
        </button>
      </div>
    </div>
  );
}

/* ─── Manage Buy-ins Modal ─── */
function ManageBuyInsModal({
  playerName,
  buyIns,
  onRemove,
  onUpdate,
  onClose,
}: {
  playerName: string;
  buyIns: { amount: number; timestamp: string }[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, newAmount: number) => void;
  onClose: () => void;
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const total = buyIns.reduce((s, b) => s + b.amount, 0);

  const startEdit = (idx: number, amount: number) => {
    setEditIndex(idx);
    setEditAmount(amount);
    setConfirmRemove(null);
  };

  const saveEdit = () => {
    if (editIndex !== null && editAmount >= 1) {
      onUpdate(editIndex, editAmount);
      setEditIndex(null);
    }
  };

  const handleRemove = (idx: number) => {
    if (confirmRemove === idx) {
      onRemove(idx);
      setConfirmRemove(null);
    } else {
      setConfirmRemove(idx);
      setEditIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-[60]">
      <div className="bg-zinc-900 border-t border-zinc-700 w-full max-w-lg rounded-t-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-tight">{playerName}</h3>
            <p className="text-zinc-500 text-xs">Manage buy-ins · Total: <span className="text-white font-bold">₪{total}</span></p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <Icon name="close" />
          </button>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {buyIns.map((b, idx) => {
            const time = new Date(b.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const isEditing = editIndex === idx;
            const isConfirmingRemove = confirmRemove === idx;
            const isLastBuyIn = buyIns.length === 1;

            return (
              <div key={idx} className="bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 space-y-2">
                {isEditing ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-xs uppercase font-bold">Edit Buy-in #{idx + 1}</span>
                      <span className="text-zinc-600 text-xs">{time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setEditAmount(v => Math.max(10, v - 10))}
                        className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700">
                        <Icon name="remove" className="!text-sm" />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-2xl font-black text-white">{editAmount}</span>
                        <span className="text-zinc-500 ml-1">₪</span>
                      </div>
                      <button onClick={() => setEditAmount(v => v + 10)}
                        className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700">
                        <Icon name="add" className="!text-sm" />
                      </button>
                    </div>
                    <div className="flex gap-2 justify-center">
                      {[20, 50, 100, 200].map((v) => (
                        <button key={v} onClick={() => setEditAmount(v)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editAmount === v ? 'bg-red-600 text-white' : 'bg-zinc-800 border border-zinc-700 text-zinc-400'}`}>
                          {v}₪
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditIndex(null)}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg py-2">
                        Cancel
                      </button>
                      <button onClick={saveEdit}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg py-2">
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-900 w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-700">
                        <span className="text-zinc-400 text-xs font-black">#{idx + 1}</span>
                      </div>
                      <div>
                        <span className="text-white font-bold">₪{b.amount}</span>
                        <p className="text-zinc-600 text-[10px]">{time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(idx, b.amount)}
                        className="text-zinc-600 hover:text-yellow-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                        <Icon name="edit" className="!text-lg" />
                      </button>
                      {!isLastBuyIn && (
                        <button onClick={() => handleRemove(idx)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isConfirmingRemove
                              ? 'text-red-400 bg-red-900/30'
                              : 'text-zinc-600 hover:text-red-400 hover:bg-zinc-800'
                          }`}>
                          <Icon name={isConfirmingRemove ? 'delete_forever' : 'delete'} className="!text-lg" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {isConfirmingRemove && !isEditing && (
                  <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                    <Icon name="warning" className="text-red-400 !text-sm" />
                    <span className="text-red-400 text-xs font-bold flex-1">Remove ₪{b.amount} buy-in?</span>
                    <button onClick={() => setConfirmRemove(null)}
                      className="text-zinc-400 text-xs font-bold hover:text-white px-2 py-1">
                      No
                    </button>
                    <button onClick={() => { onRemove(idx); setConfirmRemove(null); }}
                      className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg">
                      Yes
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onClose}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl py-4 transition-colors uppercase tracking-widest">
          Done
        </button>
      </div>
    </div>
  );
}

/* ─── Add Player to Table Modal ─── */
function AddPlayerModal({
  currentPlayerIds,
  allPlayers,
  onAdd,
  onClose,
}: {
  currentPlayerIds: string[];
  allPlayers: { id: string; name: string }[];
  onAdd: (playerId: string, buyIn: number) => void;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [buyIn, setBuyIn] = useState(50);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-[60]">
      <div className="bg-zinc-900 border-t border-zinc-700 w-full max-w-lg rounded-t-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg uppercase tracking-tight">Add Player to Table</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <Icon name="close" />
          </button>
        </div>

        {/* Player list */}
        <div className="space-y-2">
          {allPlayers.map((player) => {
            const isPlaying = currentPlayerIds.includes(player.id);
            const isSelected = selectedId === player.id;
            const initials = player.name.slice(0, 2).toUpperCase();

            return (
              <button
                key={player.id}
                disabled={isPlaying}
                onClick={() => setSelectedId(isSelected ? null : player.id)}
                className={`w-full rounded-2xl p-4 flex items-center gap-4 text-left transition-all ${
                  isPlaying
                    ? 'bg-green-950/20 border border-green-700/40 cursor-default'
                    : isSelected
                    ? 'bg-zinc-950 border-2 border-red-600/50 neon-glow-red'
                    : 'bg-zinc-950 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  isPlaying
                    ? 'bg-green-900/30 border-2 border-green-600 text-green-400'
                    : isSelected
                    ? 'bg-zinc-800 border-2 border-red-600 text-white'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-500'
                }`}>
                  {initials}
                </div>
                <span className={`flex-1 font-bold uppercase text-sm tracking-wider ${
                  isPlaying ? 'text-green-400' : 'text-white'
                }`}>
                  {player.name}
                </span>
                {isPlaying && (
                  <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">Playing</span>
                )}
                {!isPlaying && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-red-600 border-red-600' : 'border-zinc-600'
                  }`}>
                    {isSelected && <Icon name="check" className="!text-sm text-white" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Buy-in picker (shown when player selected) */}
        {selectedId && (
          <>
            <div className="space-y-3">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Initial Buy-In</p>
              <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                <button onClick={() => setBuyIn(v => Math.max(10, v - 10))} className="w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors border border-zinc-700">
                  <Icon name="remove" />
                </button>
                <div className="text-center">
                  <span className="text-4xl font-black text-white">{buyIn}</span>
                  <span className="text-xl text-zinc-500 ml-1">₪</span>
                </div>
                <button onClick={() => setBuyIn(v => v + 10)} className="w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors border border-zinc-700">
                  <Icon name="add" />
                </button>
              </div>
              <div className="flex gap-2 justify-center">
                {[20, 50, 100, 200].map((v) => (
                  <button key={v} onClick={() => setBuyIn(v)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${buyIn === v ? 'bg-red-600 text-white' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'}`}>
                    {v}₪
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => onAdd(selectedId, buyIn)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl py-4 transition-colors uppercase tracking-widest active:scale-95"
            >
              Add to Table
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main LiveGame Component ─── */
export default function LiveGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getGame, addBuyIn, removeBuyIn, updateBuyIn, addPlayerToGame, completeGame } = useGames();
  const { players: allRosterPlayers, getPlayer } = usePlayers();

  const { toasts, showToast, dismissToast } = useToast();
  const [buyInTarget, setBuyInTarget] = useState<string | null>(null);
  const [manageBuyInsTarget, setManageBuyInsTarget] = useState<string | null>(null);
  const [showEndGame, setShowEndGame] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const game = id ? getGame(id) : undefined;

  if (!game) return <Navigate to="/" replace />;
  if (game.status === 'completed') return <Navigate to={`/game/${id}/summary`} replace />;

  const totalPot = game.players.reduce(
    (s, gp) => s + gp.buyIns.reduce((ss, b) => ss + b.amount, 0), 0
  );

  const getPlayerName = (pid: string) => getPlayer(pid)?.name ?? 'Unknown';

  // Find the player with highest buy-in (top roller)
  const playerTotals = game.players.map(gp => ({
    ...gp,
    total: gp.buyIns.reduce((s, b) => s + b.amount, 0),
  }));
  const maxTotal = Math.max(...playerTotals.map(p => p.total));

  const handleBuyIn = (amount: number) => {
    if (!buyInTarget || !id) return;
    addBuyIn(id, buyInTarget, amount);
    showToast(`₪${amount} buy-in added for ${getPlayerName(buyInTarget)}`);
    setBuyInTarget(null);
  };

  const handleEndGame = (cashOuts: Record<string, number>) => {
    if (!id) return;
    const balances = computeNetBalances(
      game.players.map((gp) => ({ ...gp, cashOut: cashOuts[gp.playerId] }))
    );
    const settlements = calculateSettlements(balances);
    completeGame(id, cashOuts, settlements);
    navigate(`/game/${id}/summary`, { replace: true });
  };

  return (
    <div className="space-y-6 -mx-6 -mt-24 pt-20 px-4 pb-40 relative"
      style={{
        backgroundImage: 'linear-gradient(to right, #1f1f1f 1px, transparent 1px), linear-gradient(to bottom, #1f1f1f 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Elapsed timer in header area */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Icon name="style" className="text-red-600" />
          <h1 className="font-black uppercase tracking-widest text-red-600 text-lg">Live Session</h1>
        </div>
        <div className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <ElapsedTimer since={game.date} />
        </div>
      </div>

      {/* Hero Stats Card */}
      <section className="relative overflow-hidden bg-zinc-950 rounded-2xl border border-zinc-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 p-4">
          <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">CASH GAME</span>
        </div>
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Current Pot Value</p>
          <h2 className="text-4xl font-black text-white tracking-tighter">₪{totalPot.toLocaleString()}</h2>
        </div>
        <div className="mt-6 flex items-center gap-3 text-zinc-400 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
          <Icon name="timer" className="text-yellow-500" />
          <span className="text-sm font-medium">{game.players.length} players at the table</span>
        </div>
      </section>

      {/* Player List Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
          Active Players ({game.players.length})
        </h3>
        <button className="text-red-500 text-xs font-bold uppercase hover:underline">Sort by stack</button>
      </div>

      {/* Player Cards */}
      <div className="space-y-3">
        {playerTotals.map((gp) => {
          const name = getPlayerName(gp.playerId);
          const initials = name.slice(0, 2).toUpperCase();
          const isTopRoller = gp.total === maxTotal && gp.total > 0;
          const buyInCount = gp.buyIns.length;

          return (
            <div
              key={gp.playerId}
              className={`relative bg-zinc-950 rounded-2xl p-4 flex items-center gap-4 transition-colors ${
                isTopRoller
                  ? 'border-2 border-red-600/50 neon-glow-red'
                  : 'border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Avatar */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white ${
                  isTopRoller ? 'border-2 border-red-600' : 'border border-zinc-800 text-zinc-500'
                }`}>
                  <span className="text-lg">{initials}</span>
                </div>
                {isTopRoller && (
                  <div className="absolute -top-2 -right-1">
                    <span className="material-symbols-outlined text-yellow-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      workspace_premium
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white truncate">{name}</h4>
                <p className="text-zinc-500 text-sm">
                  Total In: <span className="text-white font-mono">₪{gp.total.toLocaleString()}</span>
                  {buyInCount > 1 && <span className="text-zinc-600 ml-1">({buyInCount}x)</span>}
                </p>
              </div>

              {/* Quick buy-in buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { if (id) { addBuyIn(id, gp.playerId, 50); showToast(`₪50 buy-in added for ${name}`); } }}
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 active:scale-95 transition-all"
                >
                  +50
                </button>
                <button
                  onClick={() => { if (id) { addBuyIn(id, gp.playerId, 100); showToast(`₪100 buy-in added for ${name}`); } }}
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 active:scale-95 transition-all"
                >
                  +100
                </button>
                <button
                  onClick={() => setManageBuyInsTarget(gp.playerId)}
                  className="material-symbols-outlined text-zinc-500 hover:text-red-500 transition-colors p-2"
                >
                  more_vert
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Player placeholder */}
        <button
          onClick={() => setShowAddPlayer(true)}
          className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center gap-3 text-zinc-500 font-bold hover:bg-zinc-900 hover:border-zinc-700 transition-all active:scale-[0.98]"
        >
          <Icon name="person_add" />
          + ADD PLAYER TO TABLE
        </button>
      </div>

      {/* Sticky Footer — Finish & Settle */}
      <div className="fixed bottom-20 w-full left-0 px-4 pb-4 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pt-10 z-40">
        <button
          onClick={() => setShowEndGame(true)}
          className="w-full max-w-2xl mx-auto block bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-2xl shadow-red-900/40 flex items-center justify-center gap-3 active:scale-[0.97] transition-all uppercase tracking-tighter text-lg"
        >
          <Icon name="check_circle" />
          FINISH &amp; SETTLE DEBTS
        </button>
      </div>

      {/* Buy-in modal */}
      {buyInTarget && (
        <BuyInModal
          playerName={getPlayerName(buyInTarget)}
          onConfirm={handleBuyIn}
          onClose={() => setBuyInTarget(null)}
        />
      )}

      {/* Manage buy-ins modal */}
      {manageBuyInsTarget && (() => {
        const gp = game.players.find(p => p.playerId === manageBuyInsTarget);
        if (!gp) return null;
        const pName = getPlayerName(manageBuyInsTarget);
        return (
          <ManageBuyInsModal
            playerName={pName}
            buyIns={gp.buyIns}
            onRemove={(idx) => {
              if (!id) return;
              const amt = gp.buyIns[idx]?.amount;
              removeBuyIn(id, manageBuyInsTarget, idx);
              showToast(`₪${amt} buy-in removed from ${pName}`, 'error');
            }}
            onUpdate={(idx, amt) => {
              if (!id) return;
              const oldAmt = gp.buyIns[idx]?.amount;
              updateBuyIn(id, manageBuyInsTarget, idx, amt);
              showToast(`${pName}'s buy-in updated: ₪${oldAmt} → ₪${amt}`, 'info');
            }}
            onClose={() => setManageBuyInsTarget(null)}
          />
        );
      })()}

      {/* End game modal */}
      {showEndGame && (
        <EndGameModal
          players={game.players}
          getPlayerName={getPlayerName}
          onAddBuyIn={(playerId, amount) => id && addBuyIn(id, playerId, amount)}
          onConfirm={handleEndGame}
          onClose={() => setShowEndGame(false)}
          chipRate={game.chipRate}
        />
      )}

      {/* Add player to table modal */}
      {showAddPlayer && (
        <AddPlayerModal
          currentPlayerIds={game.players.map((gp) => gp.playerId)}
          allPlayers={allRosterPlayers}
          onAdd={(playerId, buyIn) => {
            if (id) {
              addPlayerToGame(id, playerId, buyIn);
              showToast(`${getPlayerName(playerId)} joined the table with ₪${buyIn}`);
            }
            setShowAddPlayer(false);
          }}
          onClose={() => setShowAddPlayer(false)}
        />
      )}
    </div>
  );
}
