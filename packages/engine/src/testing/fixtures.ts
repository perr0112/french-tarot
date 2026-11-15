import { ALL_CARDS, type Card } from '../cards';
import { createDealFromHands, type DealOptions, type Seat } from '../deal';

const suit = (s: string) => ALL_CARDS.filter((c) => c.startsWith(s));
const trumps = (from: number, to: number) =>
  ALL_CARDS.filter((c) => c.startsWith('T') && Number(c.slice(1)) >= from && Number(c.slice(1)) <= to);

/**
 * A fixed 4-player distribution: each seat holds one full suit and four trumps;
 * the chien holds the three oudlers and three high trumps.
 */
export const SIMPLE_HANDS: Card[][] = [
  [...suit('S'), ...trumps(2, 5)],
  [...suit('H'), ...trumps(6, 9)],
  [...suit('C'), ...trumps(10, 13)],
  [...suit('D'), ...trumps(14, 17)],
];
export const SIMPLE_CHIEN: Card[] = ['T18', 'T19', 'T20', 'T21', 'T01', 'EXC'];

export function simpleDeal(dealer: Seat = 0, options?: DealOptions) {
  return createDealFromHands({
    hands: SIMPLE_HANDS,
    chien: SIMPLE_CHIEN,
    dealer,
    ...(options ? { options } : {}),
  });
}
