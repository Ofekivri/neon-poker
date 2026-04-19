import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Game, GamePlayer, Settlement, ChipRate } from '../types';

export function useGames(uid: string | undefined) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setGames([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const col = collection(db, 'users', uid, 'games');
    const unsubscribe = onSnapshot(col, (snapshot) => {
      const data: Game[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Game, 'id'>),
      }));
      setGames(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  const createGame = useCallback(
    async (
      playerIds: string[],
      initialBuyIn: number,
      chipRate?: ChipRate
    ): Promise<Game> => {
      if (!uid) throw new Error('Not authenticated');
      const col = collection(db, 'users', uid, 'games');
      const players: GamePlayer[] = playerIds.map((playerId) => ({
        playerId,
        buyIns: [{ amount: initialBuyIn, timestamp: new Date().toISOString() }],
      }));

      const payload: Omit<Game, 'id'> = {
        date: new Date().toISOString(),
        status: 'active',
        players,
        ...(chipRate ? { chipRate } : {}),
      };

      const docRef = await addDoc(col, payload);
      return { id: docRef.id, ...payload };
    },
    [uid]
  );

  const addBuyIn = useCallback(
    async (gameId: string, playerId: string, amount: number) => {
      if (!uid) return;
      const game = games.find((g) => g.id === gameId);
      if (!game) return;

      const updatedPlayers = game.players.map((gp) =>
        gp.playerId !== playerId
          ? gp
          : {
              ...gp,
              buyIns: [
                ...gp.buyIns,
                { amount, timestamp: new Date().toISOString() },
              ],
            }
      );

      await updateDoc(doc(db, 'users', uid, 'games', gameId), {
        players: updatedPlayers,
      });
    },
    [uid, games]
  );

  const removeBuyIn = useCallback(
    async (gameId: string, playerId: string, buyInIndex: number) => {
      if (!uid) return;
      const game = games.find((g) => g.id === gameId);
      if (!game) return;

      const updatedPlayers = game.players.map((gp) => {
        if (gp.playerId !== playerId) return gp;
        if (gp.buyIns.length <= 1) return gp;
        return {
          ...gp,
          buyIns: gp.buyIns.filter((_, i) => i !== buyInIndex),
        };
      });

      await updateDoc(doc(db, 'users', uid, 'games', gameId), {
        players: updatedPlayers,
      });
    },
    [uid, games]
  );

  const updateBuyIn = useCallback(
    async (
      gameId: string,
      playerId: string,
      buyInIndex: number,
      newAmount: number
    ) => {
      if (!uid) return;
      const game = games.find((g) => g.id === gameId);
      if (!game) return;

      const updatedPlayers = game.players.map((gp) => {
        if (gp.playerId !== playerId) return gp;
        return {
          ...gp,
          buyIns: gp.buyIns.map((b, i) =>
            i === buyInIndex ? { ...b, amount: newAmount } : b
          ),
        };
      });

      await updateDoc(doc(db, 'users', uid, 'games', gameId), {
        players: updatedPlayers,
      });
    },
    [uid, games]
  );

  const completeGame = useCallback(
    async (
      gameId: string,
      cashOuts: Record<string, number>,
      settlements: Settlement[]
    ) => {
      if (!uid) return;
      const game = games.find((g) => g.id === gameId);
      if (!game) return;

      const updatedPlayers: GamePlayer[] = game.players.map((gp) => ({
        ...gp,
        cashOut: cashOuts[gp.playerId] ?? 0,
      }));

      await updateDoc(doc(db, 'users', uid, 'games', gameId), {
        status: 'completed',
        players: updatedPlayers,
        settlements,
      });
    },
    [uid, games]
  );

  const addPlayerToGame = useCallback(
    async (gameId: string, playerId: string, initialBuyIn: number) => {
      if (!uid) return;
      const game = games.find((g) => g.id === gameId);
      if (!game) return;
      if (game.players.some((gp) => gp.playerId === playerId)) return;

      const updatedPlayers = [
        ...game.players,
        {
          playerId,
          buyIns: [
            { amount: initialBuyIn, timestamp: new Date().toISOString() },
          ],
        },
      ];

      await updateDoc(doc(db, 'users', uid, 'games', gameId), {
        players: updatedPlayers,
      });
    },
    [uid, games]
  );

  const deleteGame = useCallback(
    async (gameId: string) => {
      if (!uid) return;
      await deleteDoc(doc(db, 'users', uid, 'games', gameId));
    },
    [uid]
  );

  const getGame = useCallback(
    (gameId: string) => games.find((g) => g.id === gameId),
    [games]
  );

  const activeGame = games.find((g) => g.status === 'active');

  const completedGames = games.filter((g) => g.status === 'completed');

  return {
    games,
    loading,
    activeGame,
    completedGames,
    createGame,
    addBuyIn,
    removeBuyIn,
    updateBuyIn,
    addPlayerToGame,
    completeGame,
    deleteGame,
    getGame,
  };
}
