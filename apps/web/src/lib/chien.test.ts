import { ALL_CARDS, getPlayerView, isTrump, type Card } from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { dealWith, playOut, takes } from '../testing/views';
import { chienLeavesTo, chienOnTable } from './chien';

const hand: Card[] = [
  ...ALL_CARDS.filter((c) => isTrump(c) && Number(c.slice(1)) <= 13),
  ...ALL_CARDS.filter((c) => c.startsWith('S') && Number(c.slice(1)) <= 5),
];
const chienCards = (deal: ReturnType<typeof dealWith>) => deal.chien;

describe('chienOnTable', () => {
  it('lies face down in the centre while the players bid', () => {
    expect(chienOnTable(getPlayerView(dealWith(hand), 1))).toEqual({ faceUp: false, count: 6 });
  });

  it('is turned face up for the other players during a garde écart', () => {
    const deal = takes(dealWith(hand), 'garde');
    expect(chienOnTable(getPlayerView(deal, 1))).toEqual({
      faceUp: true,
      cards: chienCards(dealWith(hand)),
    });
  });

  it('is in the taker’s hand, not on the table, during their écart', () => {
    expect(chienOnTable(getPlayerView(takes(dealWith(hand), 'petite'), 0))).toBeNull();
  });

  it.each(['gardeSans', 'gardeContre'] as const)('leaves the table in a %s', (contract) => {
    expect(chienOnTable(getPlayerView(takes(dealWith(hand), contract), 1))).toBeNull();
  });

  it('leaves the table once the écart is made', () => {
    const deal = playOut(takes(dealWith(hand), 'garde'), [
      // The chien holds only trumps here: one of them has to go to the écart.
      [0, { type: 'ecart', cards: ['S01', 'S02', 'S03', 'S04', 'S05', 'T02'] }],
    ]);
    expect(chienOnTable(getPlayerView(deal, 1))).toBeNull();
  });
});

describe('chienLeavesTo', () => {
  it('goes to the taker’s badge in a garde sans and after a garde écart', () => {
    expect(chienLeavesTo(getPlayerView(takes(dealWith(hand), 'gardeSans'), 1))).toBe(0);
    expect(chienLeavesTo(getPlayerView(takes(dealWith(hand), 'garde'), 1))).toBe(0);
  });

  it('goes into the taker’s own hand', () => {
    expect(chienLeavesTo(getPlayerView(takes(dealWith(hand), 'garde'), 0))).toBe('hand');
  });

  it('goes to nobody in particular in a garde contre: the whole defence', () => {
    expect(chienLeavesTo(getPlayerView(takes(dealWith(hand), 'gardeContre'), 1))).toBeNull();
  });
});
