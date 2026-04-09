export interface Player {
  id: string;
  name: string;
  createdAt: string;
}

export interface BuyIn {
  amount: number;
  timestamp: string;
}

export interface GamePlayer {
  playerId: string;
  buyIns: BuyIn[];
  cashOut?: number; // undefined until end of game
}

export interface Settlement {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
}

export interface Game {
  id: string;
  date: string;
  status: 'active' | 'completed';
  players: GamePlayer[];
  settlements?: Settlement[];
}
