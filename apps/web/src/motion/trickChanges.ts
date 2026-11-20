import type { PlayedCard, Seat } from '@tarot/engine';

/** The trick shown in the centre: its cards, and its winner once it is complete. */
export interface ShownTrick {
  readonly cards: readonly PlayedCard[];
  readonly winner: Seat | null;
}

export interface TrickChanges {
  /** Cards to bring in from the seat that played them. */
  readonly arrived: readonly PlayedCard[];
  /** A completed trick leaving the centre, to slide to its winner. */
  readonly collected: { readonly winner: Seat; readonly cards: readonly PlayedCard[] } | null;
}

const has = (trick: ShownTrick, card: PlayedCard) => trick.cards.some((c) => c.card === card.card);

/**
 * What moved between two shown tricks. Nothing on the first one (a page load or reconnection
 * shows the table as it is); a completed trick whose cards left the centre is collected.
 */
export function trickChanges(before: ShownTrick | null, after: ShownTrick): TrickChanges {
  if (before === null) return { arrived: [], collected: null };
  const arrived = after.cards.filter((card) => !has(before, card));
  const left = before.cards.some((card) => !has(after, card));
  const collected =
    left && before.winner !== null ? { winner: before.winner, cards: before.cards } : null;
  return { arrived, collected };
}
