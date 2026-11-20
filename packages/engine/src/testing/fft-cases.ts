import { ALL_CARDS, isTrump, type Card } from '../cards';
import { applyAction, type Action } from '../actions';
import { createDealFromHands, type DealState, type Seat } from '../deal';

const trumps = (from: number, to: number) =>
  ALL_CARDS.filter((c) => isTrump(c) && Number(c.slice(1)) >= from && Number(c.slice(1)) <= to);

/**
 * The FFT p. 6 case, in 4 players, dealer 3: seat 0 holds the four Kings and 14 trumps, the
 * chien brings a 15th trump and five low spades. Seat 0 takes a garde and, Kings and oudlers
 * never going to the écart, has to discard a trump (`ecartTrump`). It then leads, and may show
 * `fifteen` trumps — the discarded one again — in a triple poignée.
 */
export function fourKingsFifteenTrumps(): {
  readonly deal: DealState;
  readonly hands: readonly (readonly Card[])[];
  readonly chien: readonly Card[];
  readonly ecartTrump: Card;
  readonly fifteen: readonly Card[];
} {
  const kings: Card[] = ['S14', 'H14', 'D14', 'C14'];
  const handTrumps = trumps(2, 15);
  const chien: Card[] = ['T16', 'S01', 'S02', 'S03', 'S04', 'S05'];
  const rest = ALL_CARDS.filter(
    (c) => !kings.includes(c) && !handTrumps.includes(c) && !chien.includes(c),
  );
  const hands = [[...kings, ...handTrumps], rest.slice(0, 18), rest.slice(18, 36), rest.slice(36)];
  const moves: [Seat, Action][] = [
    [0, { type: 'bid', contract: 'garde' }],
    [1, { type: 'bid', contract: 'pass' }],
    [2, { type: 'bid', contract: 'pass' }],
    [3, { type: 'bid', contract: 'pass' }],
    [0, { type: 'ecart', cards: ['S01', 'S02', 'S03', 'S04', 'S05', 'T02'] }],
  ];
  const deal = moves.reduce(
    (state, [seat, action]) => {
      const result = applyAction(state, seat, action);
      if (!result.ok) throw new Error(result.error.code);
      return result.state;
    },
    createDealFromHands({ hands, chien, dealer: 3, options: { chelemAnnouncements: false } }),
  );
  return { deal, hands, chien, ecartTrump: 'T02', fifteen: trumps(2, 16) };
}
