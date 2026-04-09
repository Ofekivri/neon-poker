import type { Player, Game } from '../types';
import { calculateSettlements } from './settlement';

const PLAYERS_KEY = 'poker_players';
const GAMES_KEY = 'poker_games';

const MOCK_PLAYERS: Omit<Player, 'createdAt'>[] = [
  { id: 'p1', name: 'Eli' },
  { id: 'p2', name: 'Ofek' },
  { id: 'p3', name: 'Netanel' },
  { id: 'p4', name: 'Igor' },
  { id: 'p5', name: 'Peleg' },
  { id: 'p6', name: 'Yaniv' },
];

function makeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export function loadMockData() {
  // Build players
  const players: Player[] = MOCK_PLAYERS.map((p) => ({
    ...p,
    createdAt: makeDate(60),
  }));

  // Game 1 — 14 days ago (completed)
  const game1NetBalances = [
    { playerId: 'p1', net: 120 },  // Eli +120
    { playerId: 'p2', net: -50 },  // Ofek -50
    { playerId: 'p3', net: 80 },   // Netanel +80
    { playerId: 'p4', net: -90 },  // Igor -90
    { playerId: 'p5', net: -30 },  // Peleg -30
    { playerId: 'p6', net: -30 },  // Yaniv -30
  ];
  const game1: Game = {
    id: 'g1',
    date: makeDate(14),
    status: 'completed',
    players: [
      { playerId: 'p1', buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 220 },
      { playerId: 'p2', buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 50 },
      { playerId: 'p3', buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 180 },
      { playerId: 'p4', buyIns: [{ amount: 100, timestamp: makeDate(14) }, { amount: 50, timestamp: makeDate(14) }], cashOut: 60 },
      { playerId: 'p5', buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 70 },
      { playerId: 'p6', buyIns: [{ amount: 100, timestamp: makeDate(14) }], cashOut: 70 },
    ],
    settlements: calculateSettlements(game1NetBalances),
  };

  // Game 2 — 7 days ago (completed)
  const game2NetBalances = [
    { playerId: 'p1', net: -60 },  // Eli -60
    { playerId: 'p2', net: 150 },  // Ofek +150
    { playerId: 'p3', net: -40 },  // Netanel -40
    { playerId: 'p4', net: 70 },   // Igor +70
    { playerId: 'p5', net: -60 },  // Peleg -60
    { playerId: 'p6', net: -60 },  // Yaniv -60
  ];
  const game2: Game = {
    id: 'g2',
    date: makeDate(7),
    status: 'completed',
    players: [
      { playerId: 'p1', buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 40 },
      { playerId: 'p2', buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 250 },
      { playerId: 'p3', buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 60 },
      { playerId: 'p4', buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 170 },
      { playerId: 'p5', buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 40 },
      { playerId: 'p6', buyIns: [{ amount: 100, timestamp: makeDate(7) }], cashOut: 40 },
    ],
    settlements: calculateSettlements(game2NetBalances),
  };

  // Game 3 — 2 days ago (completed)
  const game3NetBalances = [
    { playerId: 'p1', net: 200 },  // Eli +200
    { playerId: 'p2', net: -80 },  // Ofek -80
    { playerId: 'p3', net: -70 },  // Netanel -70
    { playerId: 'p4', net: -50 },  // Igor -50
    { playerId: 'p6', net: 0 },    // Yaniv break-even (only 4 players this session)
  ];
  const game3: Game = {
    id: 'g3',
    date: makeDate(2),
    status: 'completed',
    players: [
      { playerId: 'p1', buyIns: [{ amount: 100, timestamp: makeDate(2) }], cashOut: 300 },
      { playerId: 'p2', buyIns: [{ amount: 100, timestamp: makeDate(2) }, { amount: 50, timestamp: makeDate(2) }], cashOut: 70 },
      { playerId: 'p3', buyIns: [{ amount: 100, timestamp: makeDate(2) }], cashOut: 30 },
      { playerId: 'p4', buyIns: [{ amount: 100, timestamp: makeDate(2) }], cashOut: 50 },
      { playerId: 'p6', buyIns: [{ amount: 100, timestamp: makeDate(2) }], cashOut: 100 },
    ],
    settlements: calculateSettlements(game3NetBalances),
  };

  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  localStorage.setItem(GAMES_KEY, JSON.stringify([game3, game2, game1]));

  // Force page reload so hooks re-read from localStorage
  window.location.reload();
}

export function clearAllData() {
  localStorage.removeItem(PLAYERS_KEY);
  localStorage.removeItem(GAMES_KEY);
  window.location.reload();
}
