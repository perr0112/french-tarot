import { describe, expect, it } from 'vitest';
import { ALL_CARDS, createDeal, createDealFromHands, type Card } from './index';

const allDealtCards = (deal: { hands: readonly (readonly Card[])[]; chien: readonly Card[] }) => [
  ...deal.hands.flat(),
  ...deal.chien,
];

describe('createDeal (4 players)', () => {
  it('deals 18 cards to each seat and 6 to the chien, using every card once', () => {
    const deal = createDeal({ players: 4, dealer: 0, seed: 42 });
    expect(deal.hands.map((hand) => hand.length)).toEqual([18, 18, 18, 18]);
    expect(deal.chien).toHaveLength(6);
    expect([...allDealtCards(deal)].sort()).toEqual([...ALL_CARDS].sort());
  });

  it('is reproducible from its seed', () => {
    const a = createDeal({ players: 4, dealer: 2, seed: 1234 });
    const b = createDeal({ players: 4, dealer: 2, seed: 1234 });
    const c = createDeal({ players: 4, dealer: 2, seed: 1235 });
    expect(a).toEqual(b);
    expect(a.hands).not.toEqual(c.hands);
  });

  it('opens the bidding with the seat after the dealer', () => {
    const deal = createDeal({ players: 4, dealer: 3, seed: 7 });
    if (deal.phase === 'cancelled') return; // a petit sec seed is covered below
    expect(deal.phase).toBe('bidding');
    expect(deal.turn).toBe(0);
  });
});

// A fixed, valid 4-player distribution to build precise situations.
const SPADES = ALL_CARDS.filter((c) => c.startsWith('S'));
const HEARTS = ALL_CARDS.filter((c) => c.startsWith('H'));
const DIAMONDS = ALL_CARDS.filter((c) => c.startsWith('D'));
const CLUBS = ALL_CARDS.filter((c) => c.startsWith('C'));

describe('petit sec', () => {
  it('cancels the deal when a hand holds the Petit as its only trump and no Excuse', () => {
    // Seat 1: Petit + 14 hearts + 3 diamonds. Other trumps and the Excuse elsewhere.
    const hands: Card[][] = [
      [...SPADES, 'T02', 'T03', 'T04', 'T05'],
      ['T01', ...HEARTS, 'D01', 'D02', 'D03'],
      [...CLUBS, 'T06', 'T07', 'T08', 'T09'],
      ['D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10', 'D11', 'D12', 'D13', 'D14', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15', 'T16'],
    ];
    const chien: Card[] = ['T17', 'T18', 'T19', 'T20', 'T21', 'EXC'];
    expect(DIAMONDS).toHaveLength(14);
    const deal = createDealFromHands({ hands, chien, dealer: 0 });
    expect(deal).toMatchObject({ phase: 'cancelled', cancelled: { reason: 'petitSec', seat: 1 } });
  });

  it('does not cancel when the Petit is accompanied by the Excuse', () => {
    const hands: Card[][] = [
      [...SPADES, 'T02', 'T03', 'T04', 'T05'],
      ['T01', 'EXC', ...HEARTS, 'D01', 'D02'],
      [...CLUBS, 'T06', 'T07', 'T08', 'T09'],
      ['D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10', 'D11', 'D12', 'D13', 'D14', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15'],
    ];
    const chien: Card[] = ['T16', 'T17', 'T18', 'T19', 'T20', 'T21'];
    const deal = createDealFromHands({ hands, chien, dealer: 0 });
    expect(deal.phase).toBe('bidding');
  });
});
