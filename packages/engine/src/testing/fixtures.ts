import { ALL_CARDS, type Card } from '../cards';
import { applyAction, type Action } from '../actions';
import { createDealFromHands, type DealOptions, type DealState, type Seat } from '../deal';

const suit = (s: string) => ALL_CARDS.filter((c) => c.startsWith(s));
const trumps = (from: number, to: number) =>
  ALL_CARDS.filter(
    (c) => c.startsWith('T') && Number(c.slice(1)) >= from && Number(c.slice(1)) <= to,
  );

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

export const bid = (
  contract: 'pass' | 'petite' | 'garde' | 'gardeSans' | 'gardeContre',
): Action => ({
  type: 'bid',
  contract,
});

/** Seat `taker` wins the bidding with `contract`; everyone else passes. */
export function takeWith(
  deal: DealState,
  taker: Seat,
  contract: Parameters<typeof bid>[0],
): DealState {
  const moves: [Seat, Action][] = Array.from({ length: deal.players }, (_, i) => {
    const seat = (deal.dealer + 1 + i) % deal.players;
    return [seat, bid(seat === taker ? contract : 'pass')];
  });
  return play(deal, moves);
}

export const card = (c: Card): Action => ({ type: 'playCard', card: c });

/**
 * A 4-player distribution with mixed suits for trick-play rules:
 * seat 0 spades/hearts and low+mid trumps, seat 1 spades/hearts and mixed trumps,
 * seat 2 spades/hearts/diamonds and the Excuse, seat 3 diamonds and clubs (no trump).
 */
export const MIXED_HANDS: Card[][] = [
  [
    'S01',
    'S02',
    'S03',
    'S04',
    'S05',
    'H01',
    'H02',
    'H03',
    'H04',
    'H05',
    'T02',
    'T03',
    'T04',
    'T05',
    'T10',
    'T11',
    'T12',
    'T13',
  ],
  [
    'S06',
    'S07',
    'S08',
    'S09',
    'S10',
    'H06',
    'H07',
    'H08',
    'H09',
    'H10',
    'T06',
    'T07',
    'T08',
    'T09',
    'T14',
    'T15',
    'T16',
    'T17',
  ],
  [
    'S11',
    'S12',
    'S13',
    'S14',
    'H11',
    'H12',
    'H13',
    'H14',
    'D01',
    'D02',
    'D03',
    'D04',
    'D05',
    'D06',
    'D07',
    'D08',
    'D09',
    'EXC',
  ],
  ['D11', 'D12', 'D13', 'D14', ...suit('C')],
];
export const MIXED_CHIEN: Card[] = ['T18', 'T19', 'T20', 'T21', 'T01', 'D10'];

/** MIXED_HANDS in play: garde sans by seat 3, no chelem announcements. */
export function mixedDealInPlay(dealer: Seat): DealState {
  const deal = createDealFromHands({
    hands: MIXED_HANDS,
    chien: MIXED_CHIEN,
    dealer,
    options: { chelemAnnouncements: false },
  });
  return takeWith(deal, 3, 'gardeSans');
}

const range = (s: string, from: number, to: number) =>
  suit(s).filter((c) => Number(c.slice(1)) >= from && Number(c.slice(1)) <= to);

/**
 * A fixed 5-player distribution: seats 0–3 hold ranks 1–10 of one suit (spades, hearts,
 * diamonds, clubs) plus trumps; seat 4 holds the court cards but the King of clubs, which is
 * in the chien with the Petit and the 21.
 */
export const FIVE_HANDS: Card[][] = [
  [...range('S', 1, 10), ...trumps(2, 6)],
  [...range('H', 1, 10), ...trumps(7, 11)],
  [...range('D', 1, 10), ...trumps(12, 16)],
  [...range('C', 1, 10), ...trumps(17, 20), 'EXC'],
  [...range('S', 11, 14), ...range('H', 11, 14), ...range('D', 11, 14), 'C11', 'C12', 'C13'],
];
export const FIVE_CHIEN: Card[] = ['C14', 'T01', 'T21'];

export function fiveDeal(dealer: Seat = 0, options?: DealOptions) {
  return createDealFromHands({
    hands: FIVE_HANDS,
    chien: FIVE_CHIEN,
    dealer,
    ...(options ? { options } : {}),
  });
}

/** Swaps two cards between the hands and chien of a distribution. */
export function swapCards(
  hands: readonly (readonly Card[])[],
  chien: readonly Card[],
  a: Card,
  b: Card,
): { hands: Card[][]; chien: Card[] } {
  const swap = (c: Card): Card => (c === a ? b : c === b ? a : c);
  return { hands: hands.map((h) => h.map(swap)), chien: chien.map(swap) };
}

export const callKing = (c: Card): Action => ({ type: 'callKing', card: c });
