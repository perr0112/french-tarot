import { KING, isOudler, isTrump, rankOf, type Card } from './cards';
import { startChelemDecisionOrPlay } from './chelem';
import { CONTRACT_RULES, type Contract } from './contracts';
import { handOf, handsWithout, type DealState, type Seat } from './deal';
import { fail, type ActionResult } from './result';
import { variantFor } from './variant';

export interface EcartTemplate {
  readonly type: 'ecart';
  readonly count: number;
  /** Cards that may go to the écart, sorted. */
  readonly eligible: readonly Card[];
  /** True when the taker cannot avoid discarding trumps (they will be shown). */
  readonly trumpsAllowed: boolean;
}

const neverDiscardable = (card: Card) => isOudler(card) || rankOf(card) === KING;

function plainEligible(hand: readonly Card[]): Card[] {
  return hand.filter((card) => !neverDiscardable(card) && !isTrump(card));
}

/**
 * Once the contract (and in 5 players the called King) is settled: in petite or garde the taker
 * takes the chien and makes the écart, otherwise the chien stays aside.
 */
export function startEcartOrChelem(state: DealState): DealState {
  const taker = state.taker as Seat;
  if (CONTRACT_RULES[state.contract as Contract].chien !== 'takerHand') {
    return startChelemDecisionOrPlay(state);
  }
  const hands = state.hands.map((hand, seat) =>
    seat === taker ? [...hand, ...state.chien] : hand,
  );
  return { ...state, hands, phase: 'ecart', turn: taker };
}

export function ecartTemplate(state: DealState, seat: Seat): EcartTemplate {
  const hand = handOf(state, seat);
  const count = variantFor(state.players).chienSize;
  const plain = plainEligible(hand);
  const trumpsAllowed = plain.length < count;
  const trumps = trumpsAllowed ? hand.filter((card) => isTrump(card) && !isOudler(card)) : [];
  return { type: 'ecart', count, eligible: [...plain, ...trumps].sort(), trumpsAllowed };
}

export function applyEcart(state: DealState, seat: Seat, cards: readonly Card[]): ActionResult {
  const hand = handOf(state, seat);
  const { count } = ecartTemplate(state, seat);
  if (cards.length !== count || new Set(cards).size !== count) return fail('ECART_WRONG_COUNT');
  if (cards.some((card) => !hand.includes(card))) return fail('CARD_NOT_IN_HAND');
  if (cards.some(neverDiscardable)) return fail('ECART_FORBIDDEN_CARD');

  // Trumps only if unavoidable: every other eligible card must be discarded first.
  const plain = plainEligible(hand);
  const discardsTrump = cards.some(isTrump);
  if (discardsTrump && plain.some((card) => !cards.includes(card))) {
    return fail('ECART_TRUMP_AVOIDABLE');
  }

  const hands = handsWithout(state, seat, cards);
  return { ok: true, state: startChelemDecisionOrPlay({ ...state, hands, ecart: [...cards] }) };
}
