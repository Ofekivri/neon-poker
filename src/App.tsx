import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import NewGame from './pages/NewGame';
import LiveGame from './pages/LiveGame';
import GameSummary from './pages/GameSummary';

function App() {
  return (
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
  );
}

export default App;
