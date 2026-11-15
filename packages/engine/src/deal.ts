import { ALL_CARDS, EXCUSE, PETIT, isTrump, type Card } from './cards';
import type { BidChoice, Contract } from './contracts';
import type { CurrentTrick, Trick } from './play';
import type { Poignee } from './poignee';
import type { Breakdown } from './scoring';
import { createRng, shuffle } from './rng';
import { isPlayerCount, variantFor, type PlayerCount } from './variant';

export type Seat = number;

export interface DealOptions {
  readonly chelemAnnouncements: boolean;
}

export const DEFAULT_DEAL_OPTIONS: DealOptions = { chelemAnnouncements: true };

export type Phase =
  'bidding' | 'kingCall' | 'ecart' | 'chelemDecision' | 'playing' | 'finished' | 'cancelled';

export type CancelReason =
  { readonly reason: 'petitSec'; readonly seat: Seat } | { readonly reason: 'allPassed' };

export interface Bid {
  readonly seat: Seat;
  readonly contract: BidChoice;
}

/** The whole state of one deal: plain, immutable, JSON-serialisable data (ADR-0002). */
export interface DealState {
  readonly players: PlayerCount;
  readonly options: DealOptions;
  readonly dealer: Seat;
  readonly phase: Phase;
  /** Seat expected to act, or null when nobody is (finished, cancelled). */
  readonly turn: Seat | null;
  readonly hands: readonly (readonly Card[])[];
  readonly chien: readonly Card[];
  readonly bids: readonly Bid[];
  readonly taker: Seat | null;
  readonly contract: Contract | null;
  /** The card the taker called (5 players), or null. */
  readonly calledCard: Card | null;
  /** The partner (5 players): holder of the called card; null when the taker plays alone. */
  readonly partner: Seat | null;
  /** Cards the taker discarded (petite, garde); hidden except for trumps. */
  readonly ecart: readonly Card[];
  readonly chelemAnnounced: boolean;
  readonly poignees: readonly Poignee[];
  /** Completed tricks, in order. */
  readonly tricks: readonly Trick[];
  readonly currentTrick: CurrentTrick | null;
  /** Score breakdown, once the deal is finished. */
  readonly result: Breakdown | null;
  readonly cancelled: CancelReason | null;
}

type DealBase = Pick<DealState, 'players' | 'options' | 'dealer' | 'hands' | 'chien'>;

export interface CreateDealInput {
  readonly players: PlayerCount;
  readonly dealer: Seat;
  readonly seed: number;
  readonly options?: DealOptions;
}

export function nextSeat(seat: Seat, players: number): Seat {
  return (seat + 1) % players;
}

/** Whether a seat is on the taker's side: the taker, or the partner in 5 players. */
export function isTakerSide(state: DealState, seat: Seat): boolean {
  return seat === state.taker || seat === state.partner;
}

export function handOf(state: DealState, seat: Seat): readonly Card[] {
  return state.hands[seat] ?? [];
}

/** All hands, with `cards` removed from `seat`'s hand. */
export function handsWithout(
  state: DealState,
  seat: Seat,
  cards: readonly Card[],
): DealState['hands'] {
  return state.hands.map((hand, s) => (s === seat ? hand.filter((c) => !cards.includes(c)) : hand));
}

/**
 * Shuffles with the seed, then deals literally (AGENTS.md §3.2): packets of `dealBatch` cards
 * to each seat in turn from the dealer's next seat, and chien cards one at a time between
 * packets — never the first or last card of the deck.
 */
export function createDeal({ players, dealer, seed, options }: CreateDealInput): DealState {
  const variant = variantFor(players);
  const rng = createRng(seed);
  const deck = shuffle(ALL_CARDS, rng);

  const packets = (variant.players * variant.cardsPerPlayer) / variant.dealBatch;
  // Gaps between packets 1..packets-1 that receive one chien card each.
  const gaps = shuffle(
    Array.from({ length: packets - 1 }, (_, i) => i + 1),
    rng,
  ).slice(0, variant.chienSize);

  const hands: Card[][] = Array.from({ length: players }, () => []);
  const chien: Card[] = [];
  let cursor = 0;
  let seat = nextSeat(dealer, players);
  for (let packet = 0; packet < packets; packet++) {
    if (gaps.includes(packet)) chien.push(deck[cursor++] as Card);
    for (let i = 0; i < variant.dealBatch; i++) hands[seat]?.push(deck[cursor++] as Card);
    seat = nextSeat(seat, players);
  }

  return startDeal({ players, dealer, hands, chien, options: options ?? DEFAULT_DEAL_OPTIONS });
}

export interface CreateDealFromHandsInput {
  readonly hands: readonly (readonly Card[])[];
  readonly chien: readonly Card[];
  readonly dealer: Seat;
  readonly options?: DealOptions;
}

/** Builds a deal from a known distribution (tests, puzzles). Throws on an invalid distribution. */
export function createDealFromHands({
  hands,
  chien,
  dealer,
  options,
}: CreateDealFromHandsInput): DealState {
  const players = hands.length;
  if (!isPlayerCount(players)) throw new Error(`Unsupported player count: ${players}`);
  const variant = variantFor(players);
  const all = [...hands.flat(), ...chien];
  if (
    hands.some((hand) => hand.length !== variant.cardsPerPlayer) ||
    chien.length !== variant.chienSize ||
    new Set(all).size !== ALL_CARDS.length ||
    all.length !== ALL_CARDS.length
  ) {
    throw new Error('Invalid distribution');
  }
  return startDeal({ players, dealer, hands, chien, options: options ?? DEFAULT_DEAL_OPTIONS });
}

function startDeal(base: DealBase): DealState {
  const petitSecSeat = base.hands.findIndex(isPetitSec);
  const initial: DealState = {
    ...base,
    phase: 'bidding',
    turn: nextSeat(base.dealer, base.players),
    bids: [],
    taker: null,
    contract: null,
    calledCard: null,
    partner: null,
    ecart: [],
    chelemAnnounced: false,
    poignees: [],
    tricks: [],
    currentTrick: null,
    result: null,
    cancelled: null,
  };
  if (petitSecSeat !== -1) {
    return {
      ...initial,
      phase: 'cancelled',
      turn: null,
      cancelled: { reason: 'petitSec', seat: petitSecSeat },
    };
  }
  return initial;
}

function isPetitSec(hand: readonly Card[]): boolean {
  const trumps = hand.filter(isTrump);
  return trumps.length === 1 && trumps[0] === PETIT && !hand.includes(EXCUSE);
}
