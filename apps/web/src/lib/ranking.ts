import { EXCUSE, TWENTY_ONE, type Card, type Seat } from '@tarot/engine';

export interface Ranked {
  readonly seat: Seat;
  readonly total: number;
  /** 1 for the best total; equal totals share a rank (1, 1, 3…). */
  readonly rank: number;
}

/** The session's final ranking (AGENTS.md §5), best total first. */
export function rankSeats(totals: readonly number[]): Ranked[] {
  const sorted = totals.map((total, seat) => ({ seat, total })).sort((a, b) => b.total - a.total);
  return sorted.map(({ seat, total }) => ({
    seat,
    total,
    rank: sorted.findIndex((r) => r.total === total) + 1,
  }));
}

/**
 * The card a rank receives on the final podium: the 21 for the winner, then the trumps downwards
 * (20, 19…), and the Excuse for the last place.
 */
export function podiumCard(rank: number, lastRank: number): Card {
  if (rank === 1) return TWENTY_ONE;
  if (rank === lastRank) return EXCUSE;
  return `T${String(22 - rank).padStart(2, '0')}` as Card;
}
