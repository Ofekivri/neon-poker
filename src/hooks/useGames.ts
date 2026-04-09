import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Game, GamePlayer, Settlement } from '../types';

const STORAGE_KEY = 'poker_games';

export function useGames() {
  const [games, setGames] = useLocalStorage<Game[]>(STORAGE_KEY, []);

  const createGame = useCallback(
    (playerIds: string[], initialBuyIn: number): Game => {
      const newGame: Game = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        status: 'active',
        players: playerIds.map((playerId) => ({
          playerId,
          buyIns: [{ amount: initialBuyIn, timestamp: new Date().toISOString() }],
        })),
      };
      setGames((prev) => [newGame, ...prev]);
      return newGame;
    },
    [setGames]
  );

  const addBuyIn = useCallback(
    (gameId: string, playerId: string, amount: number) => {
      setGames((prev) =>
        prev.map((game) => {
          if (game.id !== gameId) return game;
          return {
            ...game,
            players: game.players.map((gp) =>
              gp.playerId !== playerId
                ? gp
                : {
                    ...gp,
                    buyIns: [
                      ...gp.buyIns,
                      { amount, timestamp: new Date().toISOString() },
                    ],
                  }
            ),
          };
        })
      );
    },
    [setGames]
  );

  const removeBuyIn = useCallback(
    (gameId: string, playerId: string, buyInIndex: number) => {
      setGames((prev) =>
        prev.map((game) => {
          if (game.id !== gameId) return game;
          return {
            ...game,
            players: game.players.map((gp) => {
              if (gp.playerId !== playerId) return gp;
              // Don't allow removing the last buy-in
              if (gp.buyIns.length <= 1) return gp;
              return {
                ...gp,
                buyIns: gp.buyIns.filter((_, i) => i !== buyInIndex),
              };
            }),
          };
        })
      );
    },
    [setGames]
  );

  const updateBuyIn = useCallback(
    (gameId: string, playerId: string, buyInIndex: number, newAmount: number) => {
      setGames((prev) =>
        prev.map((game) => {
          if (game.id !== gameId) return game;
          return {
            ...game,
            players: game.players.map((gp) => {
              if (gp.playerId !== playerId) return gp;
              return {
                ...gp,
                buyIns: gp.buyIns.map((b, i) =>
                  i === buyInIndex ? { ...b, amount: newAmount } : b
                ),
              };
            }),
          };
        })
      );
    },
    [setGames]
  );

  const completeGame = useCallback(
    (
      gameId: string,
      cashOuts: Record<string, number>,
      settlements: Settlement[]
    ) => {
      setGames((prev) =>
        prev.map((game) => {
          if (game.id !== gameId) return game;
          const updatedPlayers: GamePlayer[] = game.players.map((gp) => ({
            ...gp,
            cashOut: cashOuts[gp.playerId] ?? 0,
          }));
          return {
            ...game,
            status: 'completed',
            players: updatedPlayers,
            settlements,
          };
        })
      );
    },
    [setGames]
  );

  const addPlayerToGame = useCallback(
    (gameId: string, playerId: string, initialBuyIn: number) => {
      setGames((prev) =>
        prev.map((game) => {
          if (game.id !== gameId) return game;
          if (game.players.some((gp) => gp.playerId === playerId)) return game;
          return {
            ...game,
            players: [
              ...game.players,
              {
                playerId,
                buyIns: [{ amount: initialBuyIn, timestamp: new Date().toISOString() }],
              },
            ],
          };
        })
      );
    },
    [setGames]
  );

  const getGame = useCallback(
    (gameId: string) => games.find((g) => g.id === gameId),
    [games]
  );

  const activeGame = games.find((g) => g.status === 'active');

  const completedGames = games.filter((g) => g.status === 'completed');

  return {
    games,
    activeGame,
    completedGames,
    createGame,
    addBuyIn,
    removeBuyIn,
    updateBuyIn,
    addPlayerToGame,
    completeGame,
    getGame,
  };
}
