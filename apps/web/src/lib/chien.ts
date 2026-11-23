import { CONTRACT_RULES, variantFor, type Card, type PlayerView, type Seat } from '@tarot/engine';
import { sortHand } from './hand';

/** The chien as it lies in the centre of the table, or null once it has left. */
export type ChienOnTable =
  | { readonly faceUp: false; readonly count: number }
  | { readonly faceUp: true; readonly cards: readonly Card[] };

/**
 * Where the chien goes when it leaves the centre: into the local hand (the taker's écart), to
 * a seat (the taker), to the whole defence (a garde contre), or nowhere (a cancelled deal).
 */
export type ChienDestination = Seat | 'hand' | 'defence' | null;

/**
 * Where the chien is on the table, as a seat sees it (AGENTS.md §3.3–3.4): face down while the
 * players bid (and the King is called), turned face up during a petite or garde écart for
 * everyone, the taker too, who also has its cards in hand. A garde sans or contre sets it aside
 * unseen.
 */
export function chienOnTable(deal: PlayerView): ChienOnTable | null {
  if (deal.phase === 'bidding' || deal.phase === 'kingCall') {
    return { faceUp: false, count: variantFor(deal.players).chienSize };
  }
  if (deal.phase === 'ecart' && deal.chien) {
    // Sorted like a hand, so it reads at a glance.
    return { faceUp: true, cards: sortHand(deal.chien) };
  }
  return null;
}

/** Where the chien goes once it leaves the centre (the contract rules table, AGENTS.md §2). */
export function chienLeavesTo(deal: PlayerView): ChienDestination {
  if (deal.taker === null || deal.contract === null) return null;
  switch (CONTRACT_RULES[deal.contract].chien) {
    case 'takerHand':
      return deal.taker === deal.seat ? 'hand' : deal.taker;
    case 'taker':
      return deal.taker;
    case 'defence':
      return 'defence';
  }
}
