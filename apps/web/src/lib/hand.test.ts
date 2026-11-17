import type { Card } from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { sortHand } from './hand';

describe('sortHand', () => {
  it('orders spades, hearts, clubs, diamonds by rank, then trumps, then the Excuse', () => {
    const hand: Card[] = ['EXC', 'T21', 'D02', 'C14', 'H01', 'S11', 'T01', 'S02', 'H13'];
    expect(sortHand(hand)).toEqual(['S02', 'S11', 'H01', 'H13', 'C14', 'D02', 'T01', 'T21', 'EXC']);
  });

  it('keeps red and black suits apart when a suit is missing', () => {
    expect(sortHand(['S02', 'H02', 'D02'])).toEqual(['H02', 'S02', 'D02']);
    expect(sortHand(['C05', 'H03', 'D04'])).toEqual(['H03', 'C05', 'D04']);
  });

  it('sorts trumps by number, not as text', () => {
    expect(sortHand(['T10', 'T09', 'T02'])).toEqual(['T02', 'T09', 'T10']);
  });
});
