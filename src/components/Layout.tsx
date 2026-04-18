import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useGames } from '../hooks/useGames';
import { useAuthContext } from '../contexts/AuthContext';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function Layout() {
  const { user, signOut } = useAuthContext();
  const { activeGame } = useGames(user.uid);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-body">
      {/* Top App Bar */}
      <header className="bg-zinc-950 border-b border-zinc-800 shadow-2xl shadow-red-900/20 fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Icon name="style" className="text-red-600" />
          <h1 className="text-2xl font-black italic tracking-widest text-red-600 uppercase">
            NEON POKER
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={signOut}
            className="text-zinc-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-950/20"
            title="Sign out"
          >
            <Icon name="logout" />
          </button>
          <span className="hidden md:flex gap-6 text-zinc-500 font-bold uppercase tracking-widest text-xs">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? 'text-red-500 hover:text-red-400 transition-colors'
                  : 'hover:text-red-400 transition-colors'
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to={activeGame ? `/game/${activeGame.id}` : '/game/new'}
              className={({ isActive }) =>
                isActive
                  ? 'text-red-500 hover:text-red-400 transition-colors'
                  : 'hover:text-red-400 transition-colors'
              }
            >
              Sessions
            </NavLink>
            <NavLink
              to="/players"
              className={({ isActive }) =>
                isActive
                  ? 'text-red-500 hover:text-red-400 transition-colors'
                  : 'hover:text-red-400 transition-colors'
              }
            >
              Players
            </NavLink>
          </span>
        </div>
      </header>

      {/* Page content */}
      <main className="pt-24 px-6 max-w-7xl mx-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Nav Bar (mobile) */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-t-2xl md:hidden">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-xl active:scale-110 duration-150 ${
              isActive
                ? 'text-red-600 bg-red-950/20'
                : 'text-zinc-500 hover:text-zinc-200'
            }`
          }
        >
          <Icon name="home" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </NavLink>
        <NavLink
          to={activeGame ? `/game/${activeGame.id}` : '/game/new'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-xl active:scale-110 duration-150 ${
              isActive
                ? 'text-red-600 bg-red-950/20'
                : 'text-zinc-500 hover:text-zinc-200'
            }`
          }
        >
          <Icon name="dashboard" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {activeGame ? 'Live' : 'Session'}
          </span>
        </NavLink>
        <NavLink
          to="/players"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-xl active:scale-110 duration-150 ${
              isActive
                ? 'text-red-600 bg-red-950/20'
                : 'text-zinc-500 hover:text-zinc-200'
            }`
          }
        >
          <Icon name="group" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Players</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-xl active:scale-110 duration-150 ${
              isActive
                ? 'text-red-600 bg-red-950/20'
                : 'text-zinc-500 hover:text-zinc-200'
            }`
          }
        >
          <Icon name="settings" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
