import { variantFor, type Card, type PlayerView, type Seat } from '@tarot/engine';

/** The chien as it lies in the centre of the table, or null once it has left. */
export type ChienOnTable =
  | { readonly faceUp: false; readonly count: number }
  | { readonly faceUp: true; readonly cards: readonly Card[] };

/**
 * Where the chien is on the table, as a seat sees it (AGENTS.md §3.3–3.4): face down while the
 * players bid (and the King is called), turned face up during a petite or garde écart for everyone
 * but the taker, who has it in hand. A garde sans or contre sets it aside unseen.
 */
export function chienOnTable(deal: PlayerView): ChienOnTable | null {
  if (deal.phase === 'bidding' || deal.phase === 'kingCall') {
    return { faceUp: false, count: variantFor(deal.players).chienSize };
  }
  if (deal.phase === 'ecart' && deal.chien && deal.seat !== deal.taker) {
    return { faceUp: true, cards: deal.chien };
  }
  return null;
}

/**
 * Where the chien goes when it leaves the centre: into the local hand (the taker's écart), to
 * the taker's seat (taken, or a garde sans), or null when it goes to the whole defence.
 */
export function chienLeavesTo(deal: PlayerView): Seat | 'hand' | null {
  if (deal.taker === null || deal.contract === 'gardeContre') return null;
  if (deal.taker === deal.seat && deal.contract !== 'gardeSans') return 'hand';
  return deal.taker;
}
