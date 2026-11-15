import { ALL_CARDS, EXCUSE, PETIT, isTrump, type Card } from './cards';
import { createRng, shuffle } from './rng';
import { variantFor, type PlayerCount } from './variant';

export type Seat = number;

export interface DealOptions {
  readonly chelemAnnouncements: boolean;
}

export const DEFAULT_DEAL_OPTIONS: DealOptions = { chelemAnnouncements: true };

export type CancelReason = { readonly reason: 'petitSec'; readonly seat: Seat };

interface DealBase {
  readonly players: PlayerCount;
  readonly options: DealOptions;
  readonly dealer: Seat;
  readonly hands: readonly (readonly Card[])[];
  readonly chien: readonly Card[];
}

export type DealState =
  | (DealBase & { readonly phase: 'bidding'; readonly turn: Seat })
  | (DealBase & { readonly phase: 'cancelled'; readonly cancelled: CancelReason });

export interface CreateDealInput {
  readonly players: PlayerCount;
  readonly dealer: Seat;
  readonly seed: number;
  readonly options?: DealOptions;
}

export function nextSeat(seat: Seat, players: number): Seat {
  return (seat + 1) % players;
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
  const players = hands.length as PlayerCount;
  const variant = variantFor(players);
  if (!variant) throw new Error(`Unsupported player count: ${hands.length}`);
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
  if (petitSecSeat !== -1) {
    return { ...base, phase: 'cancelled', cancelled: { reason: 'petitSec', seat: petitSecSeat } };
  }
  return { ...base, phase: 'bidding', turn: nextSeat(base.dealer, base.players) };
}

function isPetitSec(hand: readonly Card[]): boolean {
  const trumps = hand.filter(isTrump);
  return trumps.length === 1 && trumps[0] === PETIT && !hand.includes(EXCUSE);
}
