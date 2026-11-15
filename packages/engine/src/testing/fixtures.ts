import { ALL_CARDS, type Card } from '../cards';
import { applyAction, type Action } from '../actions';
import { createDealFromHands, type DealOptions, type DealState, type Seat } from '../deal';

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

/** Applies moves in order, failing loudly on the first illegal one. */
export function play(state: DealState, moves: [Seat, Action][]): DealState {
  return moves.reduce((s, [seat, action]) => {
    const result = applyAction(s, seat, action);
    if (!result.ok) throw new Error(`${seat} ${JSON.stringify(action)}: ${result.error.code}`);
    return result.state;
  }, state);
}

export const bid = (contract: 'pass' | 'petite' | 'garde' | 'gardeSans' | 'gardeContre'): Action => ({
  type: 'bid',
  contract,
});

/** Seat `taker` wins the bidding with `contract`; dealer is 0, so seat 1 speaks first. */
export function takeWith(deal: DealState, taker: Seat, contract: Parameters<typeof bid>[0]): DealState {
  const moves: [Seat, Action][] = [1, 2, 3, 0].map((seat) => [
    seat,
    bid(seat === taker ? contract : 'pass'),
  ]);
  return play(deal, moves);
}
