import type { Settlement } from '../types';

export interface NetBalance {
  playerId: string;
  net: number;
}

export function calculateSettlements(balances: NetBalance[]): Settlement[] {
  const creditors = balances
    .filter((p) => p.net > 0.01)
    .map((p) => ({ ...p }))
    .sort((a, b) => b.net - a.net);

  const debtors = balances
    .filter((p) => p.net < -0.01)
    .map((p) => ({ ...p }))
    .sort((a, b) => a.net - b.net);

  const txns: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i].net, creditors[j].net);
    txns.push({
      fromPlayerId: debtors[i].playerId,
      toPlayerId: creditors[j].playerId,
      amount: Math.round(amount * 100) / 100,
    });
    debtors[i].net += amount;
    creditors[j].net -= amount;
    if (Math.abs(debtors[i].net) < 0.01) i++;
    if (Math.abs(creditors[j].net) < 0.01) j++;
  }

  return txns;
}

export function computeNetBalances(
  players: { playerId: string; buyIns: { amount: number }[]; cashOut?: number }[]
): NetBalance[] {
  return players.map((gp) => {
    const totalBuyIn = gp.buyIns.reduce((sum, b) => sum + b.amount, 0);
    const cashOut = gp.cashOut ?? 0;
    return { playerId: gp.playerId, net: cashOut - totalBuyIn };
  });
}
