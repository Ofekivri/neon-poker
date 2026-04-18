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
import type { Player } from '../types';

export function usePlayers(uid: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!uid) {
      setPlayers([]);
      return;
    }
    const col = collection(db, 'users', uid, 'players');
    const unsubscribe = onSnapshot(col, (snapshot) => {
      const data: Player[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Player, 'id'>),
      }));
      setPlayers(data);
    });
    return unsubscribe;
  }, [uid]);

  const addPlayer = useCallback(
    async (name: string) => {
      if (!uid) return;
      const col = collection(db, 'users', uid, 'players');
      const payload = {
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(col, payload);
      return { id: docRef.id, ...payload } as Player;
    },
    [uid]
  );

  const updatePlayer = useCallback(
    async (id: string, name: string) => {
      if (!uid) return;
      await updateDoc(doc(db, 'users', uid, 'players', id), {
        name: name.trim(),
      });
    },
    [uid]
  );

  const deletePlayer = useCallback(
    async (id: string) => {
      if (!uid) return;
      await deleteDoc(doc(db, 'users', uid, 'players', id));
    },
    [uid]
  );

  const getPlayer = useCallback(
    (id: string) => players.find((p) => p.id === id),
    [players]
  );

  return { players, addPlayer, updatePlayer, deletePlayer, getPlayer };
}
