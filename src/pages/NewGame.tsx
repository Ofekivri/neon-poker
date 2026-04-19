import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayers } from '../hooks/usePlayers';
import { useGames } from '../hooks/useGames';
import { useSettings } from '../hooks/useSettings';
import { shekelToChips } from '../utils/chips';
import { useAuthContext } from '../contexts/AuthContext';
import type { ChipRate } from '../types';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function NewGame() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { players } = usePlayers(user.uid);
  const { createGame, activeGame } = useGames(user.uid);
  const { settings } = useSettings(user.uid);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [buyIn, setBuyIn] = useState<number | null>(null);
  const [chipRateEnabled, setChipRateEnabled] = useState(false);
  const [chipRateShekel, setChipRateShekel] = useState(20);
  const [chipRateChips, setChipRateChips] = useState(600);

  // Use settings default if user hasn't changed buy-in yet
  const effectiveBuyIn = buyIn ?? settings.defaultBuyIn;

  if (activeGame) {
    navigate(`/game/${activeGame.id}`, { replace: true });
    return null;
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const chipRate: ChipRate | undefined = chipRateEnabled && chipRateShekel > 0 && chipRateChips > 0
    ? { shekelAmount: chipRateShekel, chipAmount: chipRateChips }
    : undefined;

  const startingChips = chipRate ? shekelToChips(effectiveBuyIn, chipRate) : null;

  const handleStart = async () => {
    if (selected.size < 2) return;
    const game = await createGame([...selected], effectiveBuyIn, chipRate);
    navigate(`/game/${game.id}`, { replace: true });
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">New Session</h1>
        <p className="text-zinc-500 text-sm">Set up tonight's table</p>
      </div>

      {/* Buy-in Amount */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Starting Buy-In</p>
        <div className="flex items-center justify-between">
          <button onClick={() => setBuyIn(Math.max(10, effectiveBuyIn - 10))}
            className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700 transition-colors">
            <Icon name="remove" />
          </button>
          <div className="text-center">
            <span className="text-4xl font-black text-white">{effectiveBuyIn}</span>
            <span className="text-xl text-zinc-500 ml-1">₪</span>
            {startingChips !== null && (
              <p className="text-xs text-red-400 font-bold mt-1">= {startingChips.toLocaleString()} chips</p>
            )}
          </div>
          <button onClick={() => setBuyIn(effectiveBuyIn + 10)}
            className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700 transition-colors">
            <Icon name="add" />
          </button>
        </div>
        <div className="flex gap-2 mt-4 justify-center">
          {[20, 50, 100, 200].map((v) => (
            <button key={v} onClick={() => setBuyIn(v)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${
                effectiveBuyIn === v ? 'bg-red-600 text-white' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
              }`}>
              {v}₪
            </button>
          ))}
        </div>
      </section>

      {/* Chip Rate */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Chip Rate</p>
          <button
            onClick={() => setChipRateEnabled(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${chipRateEnabled ? 'bg-red-600' : 'bg-zinc-700'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${chipRateEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {chipRateEnabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-zinc-600 text-xs uppercase font-bold mb-1">₪ Amount</p>
                <input
                  type="number"
                  value={chipRateShekel}
                  onChange={e => setChipRateShekel(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white font-bold rounded-xl px-4 py-3 text-center text-lg focus:outline-none focus:border-red-600"
                  min={1}
                />
              </div>
              <span className="text-zinc-500 font-black text-xl mt-5">=</span>
              <div className="flex-1">
                <p className="text-zinc-600 text-xs uppercase font-bold mb-1">Chips</p>
                <input
                  type="number"
                  value={chipRateChips}
                  onChange={e => setChipRateChips(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white font-bold rounded-xl px-4 py-3 text-center text-lg focus:outline-none focus:border-red-600"
                  min={1}
                />
              </div>
            </div>
            {chipRate && (
              <p className="text-center text-zinc-400 text-xs font-bold">
                Each player starts with{' '}
                <span className="text-red-400">{shekelToChips(effectiveBuyIn, chipRate).toLocaleString()} chips</span>
                {' '}for {effectiveBuyIn}₪
              </p>
            )}
          </div>
        )}

        {!chipRateEnabled && (
          <p className="text-zinc-600 text-xs">Enable to track chip counts alongside ₪ amounts</p>
        )}
      </section>

      {/* Player Selection */}
      <section>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 px-2">
          Select Players ({selected.size} selected)
        </p>
        {players.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm font-bold uppercase">No players in roster</p>
            <button onClick={() => navigate('/players')}
              className="mt-4 text-red-500 text-xs font-bold uppercase hover:underline">
              Add Players First
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => {
              const isSelected = selected.has(player.id);
              const initials = player.name.slice(0, 2).toUpperCase();
              return (
                <button key={player.id} onClick={() => toggle(player.id)}
                  className={`w-full bg-zinc-950 rounded-2xl p-4 flex items-center gap-4 text-left transition-all ${
                    isSelected ? 'border-2 border-red-600/50 neon-glow-red' : 'border border-zinc-800 hover:border-zinc-700'
                  }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    isSelected ? 'bg-zinc-800 border-2 border-red-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                  }`}>
                    {initials}
                  </div>
                  <span className="flex-1 font-bold text-white uppercase text-sm tracking-wider">{player.name}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-red-600 border-red-600' : 'border-zinc-600'
                  }`}>
                    {isSelected && <Icon name="check" className="!text-sm text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Start Button */}
      <button onClick={handleStart} disabled={selected.size < 2}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl shadow-2xl shadow-red-900/40 flex items-center justify-center gap-3 active:scale-[0.97] transition-all uppercase tracking-[0.2em] text-xl animate-pulse-glow">
        <Icon name="play_arrow" className="text-3xl" />
        Start Game
      </button>
      {selected.size < 2 && (
        <p className="text-center text-zinc-600 text-xs font-bold uppercase -mt-4">Select at least 2 players</p>
      )}
    </div>
  );
}
