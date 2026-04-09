import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Player } from '../types';

const STORAGE_KEY = 'poker_players';

export function usePlayers() {
  const [players, setPlayers] = useLocalStorage<Player[]>(STORAGE_KEY, []);

  const addPlayer = useCallback(
    (name: string) => {
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };
      setPlayers((prev) => [...prev, newPlayer]);
      return newPlayer;
    },
    [setPlayers]
  );

  const updatePlayer = useCallback(
    (id: string, name: string) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: name.trim() } : p))
      );
    },
    [setPlayers]
  );

  const deletePlayer = useCallback(
    (id: string) => {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    },
    [setPlayers]
  );

  const getPlayer = useCallback(
    (id: string) => players.find((p) => p.id === id),
    [players]
  );

  return { players, addPlayer, updatePlayer, deletePlayer, getPlayer };
}
