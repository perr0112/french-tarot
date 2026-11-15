import { EXCUSE, isTrump, rankOf, suitOf, trumpValue, type Card } from './cards';
import type { DealState, Seat } from './deal';
import { hasPlayedACard, poigneeLevel } from './poignee';
import { dealFacts, scoreDeal } from './scoring';
import { fail, type ActionResult } from './result';

export interface PlayedCard {
  readonly seat: Seat;
  readonly card: Card;
}

export interface Trick {
  readonly leader: Seat;
  readonly cards: readonly PlayedCard[];
  readonly winner: Seat;
}

export interface CurrentTrick {
  readonly leader: Seat;
  readonly cards: readonly PlayedCard[];
}

/** The card that sets the suit of a trick: the first one that is not the Excuse. */
function leadingCard(cards: readonly PlayedCard[]): Card | null {
  return cards.find(({ card }) => card !== EXCUSE)?.card ?? null;
}

function highestTrump(cards: readonly PlayedCard[]): number {
  return Math.max(0, ...cards.map(({ card }) => trumpValue(card) ?? 0));
}

/** Cards a seat may play now (AGENTS.md §3.7). */
export function playableCards(state: DealState, seat: Seat): Card[] {
  const hand = state.hands[seat] ?? [];
  const played = state.currentTrick?.cards ?? [];
  const led = leadingCard(played);
  if (led === null) return [...hand];

  const excuse = hand.includes(EXCUSE) ? [EXCUSE] : [];
  const ledSuit = suitOf(led);
  if (ledSuit !== null) {
    const follow = hand.filter((card) => suitOf(card) === ledSuit);
    if (follow.length > 0) return [...follow, ...excuse];
  }

  const trumps = hand.filter(isTrump);
  if (trumps.length === 0) return [...hand];
  const floor = highestTrump(played);
  const higher = trumps.filter((card) => (trumpValue(card) ?? 0) > floor);
  return [...(higher.length > 0 ? higher : trumps), ...excuse];
}

/** Highest trump wins, else the highest card of the led suit; the Excuse never wins here. */
function trickWinner(cards: readonly PlayedCard[]): Seat {
  const led = leadingCard(cards);
  const contenders = cards.filter(({ card }) =>
    cards.some((p) => isTrump(p.card)) ? isTrump(card) : led !== null && suitOf(card) === suitOf(led),
  );
  const strength = ({ card }: PlayedCard) => trumpValue(card) ?? rankOf(card) ?? 0;
  const best = contenders.reduce((a, b) => (strength(b) > strength(a) ? b : a));
  return best.seat;
}

export function applyPlayCard(
  state: DealState,
  seat: Seat,
  card: Card,
  poignee?: readonly Card[],
): ActionResult {
  const hand = state.hands[seat] ?? [];
  if (!hand.includes(card)) return fail('CARD_NOT_IN_HAND');
  if (!playableCards(state, seat).includes(card)) return fail('CARD_NOT_PLAYABLE');

  let poignees = state.poignees;
  if (poignee !== undefined) {
    if (hasPlayedACard(state, seat)) return fail('POIGNEE_NOT_FIRST_CARD');
    const level = poigneeLevel(state, seat, poignee);
    if (level === null) return fail('POIGNEE_INVALID');
    poignees = [...poignees, { seat, level, cards: [...poignee] }];
  }

  const hands = state.hands.map((h, s) => (s === seat ? h.filter((c) => c !== card) : h));
  const current: CurrentTrick = {
    leader: state.currentTrick?.leader ?? seat,
    cards: [...(state.currentTrick?.cards ?? []), { seat, card }],
  };

  if (current.cards.length < state.players) {
    return {
      ok: true,
      state: { ...state, hands, poignees, currentTrick: current, turn: (seat + 1) % state.players },
    };
  }

  const done = hands.every((h) => h.length === 0);
  const winner = done && excuseWinsLastTrick(state, current) ? current.leader : trickWinner(current.cards);
  const next: DealState = {
    ...state,
    hands,
    poignees,
    tricks: [...state.tricks, { ...current, winner }],
    currentTrick: null,
    phase: done ? 'finished' : 'playing',
    turn: done ? null : winner,
  };
  return { ok: true, state: done ? { ...next, result: scoreDeal(dealFacts(next)) } : next };
}

/** In a chelem, the Excuse led on the last trick by the side that won every trick wins it. */
function excuseWinsLastTrick(state: DealState, last: CurrentTrick): boolean {
  if (last.cards[0]?.card !== EXCUSE) return false;
  const isTaker = (seat: Seat) => seat === state.taker;
  return state.tricks.every((t) => isTaker(t.winner) === isTaker(last.leader));
}
