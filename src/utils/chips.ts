import type { ChipRate } from '../types';

export function chipsToShekel(chips: number, rate: ChipRate): number {
  return Math.round((chips * rate.shekelAmount) / rate.chipAmount);
}

export function shekelToChips(shekel: number, rate: ChipRate): number {
  return Math.round((shekel * rate.chipAmount) / rate.shekelAmount);
}
