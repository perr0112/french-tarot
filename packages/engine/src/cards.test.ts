import { describe, expect, it } from 'vitest';
import { ALL_CARDS, cardHalfPoints, isOudler, isTrump, rankOf, suitOf, trumpValue } from './index';

describe('cards', () => {
  it('has 78 distinct cards', () => {
    expect(ALL_CARDS).toHaveLength(78);
    expect(new Set(ALL_CARDS).size).toBe(78);
  });

  it('is worth 91 points in total', () => {
    const halfPoints = ALL_CARDS.reduce((sum, card) => sum + cardHalfPoints(card), 0);
    expect(halfPoints).toBe(182);
  });

  it('values each card family as in the FFT table', () => {
    expect(cardHalfPoints('T01')).toBe(9); // Petit 4.5
    expect(cardHalfPoints('T21')).toBe(9); // 21 4.5
    expect(cardHalfPoints('EXC')).toBe(9); // Excuse 4.5
    expect(cardHalfPoints('H14')).toBe(9); // Roi 4.5
    expect(cardHalfPoints('S13')).toBe(7); // Dame 3.5
    expect(cardHalfPoints('D12')).toBe(5); // Cavalier 2.5
    expect(cardHalfPoints('C11')).toBe(3); // Valet 1.5
    expect(cardHalfPoints('C10')).toBe(1); // 0.5
    expect(cardHalfPoints('T20')).toBe(1); // 0.5
  });

  it('knows the three oudlers', () => {
    expect(ALL_CARDS.filter(isOudler).sort()).toEqual(['EXC', 'T01', 'T21']);
  });

  it('decodes suit, rank and trump value', () => {
    expect(suitOf('H13')).toBe('H');
    expect(rankOf('H13')).toBe(13);
    expect(suitOf('T05')).toBeNull();
    expect(isTrump('T05')).toBe(true);
    expect(isTrump('EXC')).toBe(false);
    expect(trumpValue('T05')).toBe(5);
    expect(trumpValue('H05')).toBeNull();
  });
});
