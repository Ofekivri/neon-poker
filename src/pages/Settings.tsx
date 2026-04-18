import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function Settings() {
  const { user, signOut } = useAuthContext();
  const { settings, updateSettings } = useSettings(user.uid);
  const [buyIn, setBuyIn] = useState(settings.defaultBuyIn);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBuyIn(settings.defaultBuyIn);
  }, [settings.defaultBuyIn]);

  const handleSave = async () => {
    await updateSettings({ defaultBuyIn: buyIn });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Settings</h1>
        <p className="text-zinc-500 text-sm">Customize your experience</p>
      </div>

      {/* Account Info */}
      <section className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-5 space-y-3">
        <h2 className="text-xs font-black text-red-600 uppercase tracking-widest">Account</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-700/20 border border-red-700/30 flex items-center justify-center">
            <Icon name="person" className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{user.email}</p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Signed in</p>
          </div>
        </div>
      </section>

      {/* Default Buy-In */}
      <section className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-black text-red-600 uppercase tracking-widest">Default Buy-In</h2>
        <p className="text-zinc-500 text-xs">This amount will be pre-filled when starting a new session.</p>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setBuyIn((v) => Math.max(10, v - 10))}
            className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700 transition-colors"
          >
            <Icon name="remove" />
          </button>
          <div className="text-center">
            <span className="text-4xl font-black text-white">{buyIn}</span>
            <span className="text-xl text-zinc-500 ml-1">₪</span>
          </div>
          <button
            onClick={() => setBuyIn((v) => v + 10)}
            className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700 transition-colors"
          >
            <Icon name="add" />
          </button>
        </div>
        <div className="flex gap-2 justify-center">
          {[20, 50, 100, 200].map((v) => (
            <button
              key={v}
              onClick={() => setBuyIn(v)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${
                buyIn === v
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              ₪{v}
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={buyIn === settings.defaultBuyIn}
          className="w-full bg-red-700 disabled:opacity-40 text-white font-black py-3 rounded-xl uppercase tracking-widest text-sm hover:bg-red-800 active:scale-[0.97] transition-all"
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Icon name="check_circle" className="text-lg" />
              Saved!
            </span>
          ) : (
            'Save Default'
          )}
        </button>
      </section>

      {/* Sign Out */}
      <section>
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 text-zinc-400 font-black py-4 rounded-2xl uppercase tracking-widest text-sm hover:bg-zinc-800 hover:text-red-500 transition-colors"
        >
          <Icon name="logout" />
          Sign Out
        </button>
      </section>
    </div>
  );
}
