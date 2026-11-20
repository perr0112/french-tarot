import { describe, expect, it } from 'vitest';
import { podiumCard, rankSeats } from './ranking';

describe('rankSeats', () => {
  it('ranks by total, highest first, equal totals sharing a rank', () => {
    expect(rankSeats([-336, 112, 112, 112])).toEqual([
      { seat: 1, total: 112, rank: 1 },
      { seat: 2, total: 112, rank: 1 },
      { seat: 3, total: 112, rank: 1 },
      { seat: 0, total: -336, rank: 4 },
    ]);
  });
});

describe('podiumCard', () => {
  it('gives the 21 to the winner, then 20, 19… and the Excuse to the last', () => {
    expect([1, 2, 3, 4, 5].map((rank) => podiumCard(rank, 5))).toEqual([
      'T21',
      'T20',
      'T19',
      'T18',
      'EXC',
    ]);
  });

  it('gives the 21 to everyone when all are equal', () => {
    expect(podiumCard(1, 1)).toBe('T21');
  });

  it('gives the Excuse to every seat sharing the last rank', () => {
    expect(podiumCard(3, 3)).toBe('EXC');
    expect(podiumCard(2, 3)).toBe('T20');
  });
});
