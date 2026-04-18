import type { Player, Game } from '../types';
import { calculateSettlements } from './settlement';
import {
  collection,
  writeBatch,
  doc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const MOCK_PLAYERS: Omit<Player, 'id' | 'createdAt'>[] = [
  { name: 'Eli' },
  { name: 'Ofek' },
  { name: 'Netanel' },
  { name: 'Igor' },
  { name: 'Peleg' },
  { name: 'Yaniv' },
];

function makeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export async function loadMockData() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  // Clear existing data first
  await clearAllData();

  const batch = writeBatch(db);

  // Create player docs with known IDs so games can reference them
  const playerIds: string[] = [];
  for (const p of MOCK_PLAYERS) {
    const ref = doc(collection(db, 'users', uid, 'players'));
    playerIds.push(ref.id);
    batch.set(ref, {
      name: p.name,
      createdAt: makeDate(60),
    });
  }

  const [p1, p2, p3, p4, p5, p6] = playerIds;

  // Game 1 — 14 days ago (completed)
  const game1NetBalances = [
    { playerId: p1, net: 120 },
    { playerId: p2, net: -50 },
    { playerId: p3, net: 80 },
    { playerId: p4, net: -90 },
    { playerId: p5, net: -30 },
    { playerId: p6, net: -30 },
  ];
  const game1Ref = doc(collection(db, 'users', uid, 'games'));
  batch.set(game1Ref, {
    date: makeDate(14),
    status: 'completed',
    players: [
      { playerId: p1, buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 220 },
      { playerId: p2, buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 50 },
      { playerId: p3, buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 180 },
      { playerId: p4, buyIns: [{ amount: 100, timestamp: makeDate(14) }, { amount: 50, timestamp: makeDate(14) }], cashOut: 60 },
      { playerId: p5, buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 70 },
      { playerId: p6, buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 70 },
    ],
    settlements: calculateSettlements(game1NetBalances),
  });

  // Game 2 — 7 days ago (completed)
  const game2NetBalances = [
    { playerId: p1, net: -60 },
    { playerId: p2, net: 150 },
    { playerId: p3, net: -40 },
    { playerId: p4, net: 70 },
    { playerId: p5, net: -60 },
    { playerId: p6, net: -60 },
  ];
  const game2Ref = doc(collection(db, 'users', uid, 'games'));
  batch.set(game2Ref, {
    date: makeDate(7),
    status: 'completed',
    players: [
      { playerId: p1, buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 40 },
      { playerId: p2, buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 250 },
      { playerId: p3, buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 60 },
      { playerId: p4, buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 170 },
      { playerId: p5, buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 40 },
      { playerId: p6, buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 40 },
    ],
    settlements: calculateSettlements(game2NetBalances),
  });

  // Game 3 — 2 days ago (completed)
  const game3NetBalances = [
    { playerId: p1, net: 200 },
    { playerId: p2, net: -80 },
    { playerId: p3, net: -70 },
    { playerId: p4, net: -50 },
    { playerId: p6, net: 0 },
  ];
  const game3Ref = doc(collection(db, 'users', uid, 'games'));
  batch.set(game3Ref, {
    date: makeDate(2),
    status: 'completed',
    players: [
      { playerId: p1, buyIns: [{ amount: 100, timestamp: makeDate(2) }], cashOut: 300 },
      { playerId: p2, buyIns: [{ amount: 100, timestamp: makeDate(2) }, { amount: 50, timestamp: makeDate(2) }], cashOut: 70 },
      { playerId: p3, buyIns: [{ amount: 100, timestamp: makeDate(2) }], cashOut: 30 },
      { playerId: p4, buyIns: [{ amount: 100, timestamp: makeDate(2) }], cashOut: 50 },
      { playerId: p6, buyIns: [{ amount: 100, timestamp: makeDate(2) }], cashOut: 100 },
    ],
    settlements: calculateSettlements(game3NetBalances),
  });

  await batch.commit();
}

export async function clearAllData() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  // Delete all players
  const playersSnap = await getDocs(collection(db, 'users', uid, 'players'));
  for (const d of playersSnap.docs) {
    await deleteDoc(d.ref);
  }

  // Delete all games
  const gamesSnap = await getDocs(collection(db, 'users', uid, 'games'));
  for (const d of gamesSnap.docs) {
    await deleteDoc(d.ref);
  }
}
