import { EXCUSE, isTrump, type Card } from './cards';
import { handOf, playedCards, type DealState, type Seat } from './deal';
import { poigneeLevels, type PoigneeLevel } from './variant';

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
  return playedCards(state).some((p) => p.seat === seat);
}

/**
 * The trumps a seat may show in a poignée: those in hand and, for the taker, those the écart
 * forced out, already shown and shown again (FFT p. 6; they stay in the écart).
 */
function showableTrumps(state: DealState, seat: Seat): Card[] {
  const ecart = seat === state.taker ? state.ecart.filter(isTrump) : [];
  return [...handOf(state, seat).filter(isTrump), ...ecart];
}

/** Poignée levels a seat may still declare with its first card, or null. */
export function poigneeTemplate(state: DealState, seat: Seat): PoigneeTemplate | null {
  if (hasPlayedACard(state, seat)) return null;
  const hand = handOf(state, seat);
  const trumps = showableTrumps(state, seat);
  const excuse = hand.includes(EXCUSE) ? 1 : 0;
  const levels = poigneeLevels(state.players).filter(({ size }) => size <= trumps.length + excuse);
  if (levels.length === 0) return null;
  return { eligible: [...trumps, ...(excuse ? [EXCUSE] : [])].sort(), levels };
}

/** Validates shown cards (AGENTS.md §3.6); returns the level, or null if invalid. */
export function poigneeLevel(
  state: DealState,
  seat: Seat,
  cards: readonly Card[],
): PoigneeLevel | null {
  const trumps = showableTrumps(state, seat);
  const excuse = handOf(state, seat).includes(EXCUSE);
  const level = poigneeLevels(state.players).find(({ size }) => size === cards.length)?.level;
  if (level === undefined) return null;
  if (new Set(cards).size !== cards.length) return null;
  if (cards.some((c) => !trumps.includes(c) && !(c === EXCUSE && excuse))) return null;
  // The Excuse stands in for a trump only when no further trump can be shown.
  if (cards.includes(EXCUSE) && trumps.length >= cards.length) return null;
  return level;
}
