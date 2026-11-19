import type { Card } from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { trickChanges, type ShownTrick } from './trickChanges';

const shown = (cards: [number, string][], winner: number | null = null): ShownTrick => ({
  cards: cards.map(([seat, card]) => ({ seat, card: card as Card })),
  winner,
});

describe('trickChanges', () => {
  it('animates nothing on the first view (page load, reconnection)', () => {
    expect(trickChanges(null, shown([[0, 'S01']]))).toEqual({ arrived: [], collected: null });
  });

  it('brings in each card that was not shown before', () => {
    const before = shown([[1, 'S01']]);
    const after = shown([
      [1, 'S01'],
      [2, 'S07'],
    ]);
    expect(trickChanges(before, after)).toEqual({
      arrived: [{ seat: 2, card: 'S07' }],
      collected: null,
    });
  });

  it('brings in the last card of a trick, now shown as the completed trick', () => {
    const before = shown([
      [1, 'S01'],
      [2, 'S07'],
      [3, 'S09'],
    ]);
    const after = shown(
      [
        [1, 'S01'],
        [2, 'S07'],
        [3, 'S09'],
        [0, 'T02'],
      ],
      0,
    );
    expect(trickChanges(before, after)).toEqual({
      arrived: [{ seat: 0, card: 'T02' }],
      collected: null,
    });
  });

  it('collects a completed trick to its winner when the next one is led', () => {
    const before = shown(
      [
        [1, 'S01'],
        [2, 'S07'],
        [3, 'S09'],
        [0, 'T02'],
      ],
      0,
    );
    const after = shown([[0, 'H14']]);
    expect(trickChanges(before, after)).toEqual({
      arrived: [{ seat: 0, card: 'H14' }],
      collected: { winner: 0, cards: before.cards },
    });
  });

  it('removes cards of an unfinished trick without collecting them', () => {
    expect(trickChanges(shown([[1, 'S01']]), shown([]))).toEqual({
      arrived: [],
      collected: null,
    });
  });
});
