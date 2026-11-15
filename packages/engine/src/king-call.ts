import { JACK, KING, SUITS, type Card } from './cards';
import { handOf, type DealState, type Seat } from './deal';
import { startEcartOrChelem } from './phases';
import { fail, type ActionResult } from './result';

/**
 * Cards the taker may call (AGENTS.md §3.5): the four Kings, or the four cards of the highest
 * rank of which the taker does not hold all four.
 */
export function callableCards(state: DealState, seat: Seat): Card[] {
  const hand = handOf(state, seat);
  for (let rank = KING; rank >= JACK; rank--) {
    const cards = SUITS.map((suit) => `${suit}${rank}` as Card);
    if (!cards.every((card) => hand.includes(card))) return cards.sort();
  }
  return [];
}

export function applyKingCall(state: DealState, seat: Seat, card: Card): ActionResult {
  if (!callableCards(state, seat).includes(card)) return fail('KING_CALL_INVALID');
  const holder = state.hands.findIndex((hand) => hand.includes(card));
  const partner = holder === -1 || holder === seat ? null : holder;
  return { ok: true, state: startEcartOrChelem({ ...state, calledCard: card, partner }) };
}
