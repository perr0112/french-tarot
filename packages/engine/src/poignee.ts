import { EXCUSE, isTrump, type Card } from './cards';
import type { DealState, Seat } from './deal';
import { variantFor, type PoigneeLevel } from './variant';

export interface Poignee {
  readonly seat: Seat;
  readonly level: PoigneeLevel;
  readonly cards: readonly Card[];
}

export interface PoigneeTemplate {
  /** Cards that may be shown, sorted. */
  readonly eligible: readonly Card[];
  readonly levels: readonly { readonly level: PoigneeLevel; readonly size: number }[];
}

export function hasPlayedACard(state: DealState, seat: Seat): boolean {
  const played = [...state.tricks.flatMap((t) => t.cards), ...(state.currentTrick?.cards ?? [])];
  return played.some((p) => p.seat === seat);
}

/** Poignée levels a seat may still declare with its first card, or null. */
export function poigneeTemplate(state: DealState, seat: Seat): PoigneeTemplate | null {
  if (hasPlayedACard(state, seat)) return null;
  const hand = state.hands[seat] ?? [];
  const trumps = hand.filter(isTrump);
  const excuse = hand.includes(EXCUSE) ? 1 : 0;
  const sizes = variantFor(state.players).poigneeSizes;
  const levels = (Object.keys(sizes) as PoigneeLevel[])
    .map((level) => ({ level, size: sizes[level] }))
    .filter(({ size }) => size <= trumps.length + excuse);
  if (levels.length === 0) return null;
  return { eligible: [...trumps, ...(excuse ? [EXCUSE] : [])].sort(), levels };
}

/** Validates shown cards (AGENTS.md §3.6); returns the level, or null if invalid. */
export function poigneeLevel(state: DealState, seat: Seat, cards: readonly Card[]): PoigneeLevel | null {
  const hand = state.hands[seat] ?? [];
  const sizes = variantFor(state.players).poigneeSizes;
  const level = (Object.keys(sizes) as PoigneeLevel[]).find((l) => sizes[l] === cards.length);
  if (level === undefined) return null;
  if (new Set(cards).size !== cards.length) return null;
  if (cards.some((c) => !hand.includes(c) || (!isTrump(c) && c !== EXCUSE))) return null;
  // The Excuse stands in for a trump only when the hand has no further trump to show.
  if (cards.includes(EXCUSE) && hand.filter(isTrump).length >= cards.length) return null;
  return level;
}
