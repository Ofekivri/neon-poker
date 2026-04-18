import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import NewGame from './pages/NewGame';
import LiveGame from './pages/LiveGame';
import GameSummary from './pages/GameSummary';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';
import { AuthContext } from './contexts/AuthContext';

function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="material-symbols-outlined text-red-600 text-5xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) {
    return <Login onSignIn={signIn} onSignUp={signUp} />;
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="players" element={<Players />} />
            <Route path="game/new" element={<NewGame />} />
            <Route path="game/:id" element={<LiveGame />} />
            <Route path="game/:id/summary" element={<GameSummary />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
