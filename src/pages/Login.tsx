import { useState } from 'react';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

interface LoginProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export default function Login({ onSignIn, onSignUp }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await onSignUp(email, password);
      } else {
        await onSignIn(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      // Clean up Firebase error messages
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        setError('Invalid email or password');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('Email already in use');
      } else if (msg.includes('auth/weak-password')) {
        setError('Password must be at least 6 characters');
      } else if (msg.includes('auth/invalid-email')) {
        setError('Invalid email address');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Icon name="casino" className="text-red-600 text-5xl" />
          <h1 className="text-5xl font-black text-red-600 uppercase tracking-tighter">
            NEON POKER
          </h1>
        </div>
        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
          Home game tracker
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-black text-white uppercase tracking-wider text-center">
          {isRegister ? 'Create Account' : 'Sign In'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Email
            </label>
            <div className="relative">
              <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xl" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-700 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xl" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-700 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 rounded-xl px-4 py-3">
              <Icon name="error" className="text-red-500 text-lg" />
              <span className="text-red-400 text-sm font-bold">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 text-white font-black py-4 rounded-2xl uppercase tracking-[0.15em] text-lg shadow-xl shadow-red-900/40 hover:bg-red-800 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Icon name="progress_activity" className="animate-spin text-xl" />
                {isRegister ? 'Creating...' : 'Signing in...'}
              </span>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-zinc-500 text-sm font-bold hover:text-red-500 transition-colors"
          >
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
