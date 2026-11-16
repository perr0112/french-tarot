import {
  ALL_CARDS,
  applyAction,
  createDealFromHands,
  getPlayerView,
  variantFor,
  type Action,
  type Card,
  type DealState,
  type PlayerCount,
  type PlayerView,
  type Seat,
  type Suit,
  suitOf,
} from '@tarot/engine';

export interface ArrangeInput {
  readonly players: PlayerCount;
  readonly dealer?: Seat;
  /** Hands of the seats a test cares about; the others are filled from the remaining cards. */
  readonly hands: Readonly<Record<Seat, readonly Card[]>>;
  readonly chien?: readonly Card[];
  /** Suits that filled cards must not add to a seat's hand. */
  readonly voids?: Readonly<Record<Seat, readonly Suit[]>>;
}

/** A deal where some hands (and the chien) are fixed, the rest dealt round-robin. */
export function arrange({
  players,
  dealer = players - 1,
  hands,
  chien,
  voids = {},
}: ArrangeInput): DealState {
  const { cardsPerPlayer, chienSize } = variantFor(players);
  const fixed = new Set([...Object.values(hands).flat(), ...(chien ?? [])]);
  const rest = ALL_CARDS.filter((c) => !fixed.has(c));
  const filled: Card[][] = Array.from({ length: players }, (_, s) => [...(hands[s] ?? [])]);
  const theChien = [...(chien ?? [])];
  let next = 0;
  for (const card of rest) {
    const seat = Array.from({ length: players }, (_, i) => (next + i) % players).find(
      (candidate) =>
        (filled[candidate]?.length ?? 0) < cardsPerPlayer &&
        !voids[candidate]?.some((suit) => suitOf(card) === suit),
    );
    if (seat === undefined) theChien.push(card);
    else {
      filled[seat]?.push(card);
      next = (seat + 1) % players;
    }
  }
  if (theChien.length !== chienSize) throw new Error('Arranged chien has the wrong size');
  const deal = createDealFromHands({ hands: filled, chien: theChien, dealer });
  if (deal.phase === 'cancelled') throw new Error('Arranged deal is a petit sec');
  return deal;
}

/** Applies actions in order, failing loudly on the first one the engine refuses. */
export function playOut(state: DealState, moves: readonly [Seat, Action][]): DealState {
  return moves.reduce((s, [seat, action]) => {
    const result = applyAction(s, seat, action);
    if (!result.ok) throw new Error(`${seat} ${JSON.stringify(action)}: ${result.error.code}`);
    return result.state;
  }, state);
}

/** The view of the seat whose turn it is. */
export function turnView(state: DealState): PlayerView {
  if (state.turn === null) throw new Error('Nobody is to act');
  return getPlayerView(state, state.turn);
}

/** Every seat passes except `taker`, who bids `contract`. */
export function takeWith(state: DealState, taker: Seat, contract: Action & { type: 'bid' }) {
  const moves: [Seat, Action][] = Array.from({ length: state.players }, (_, i) => {
    const seat = (state.dealer + 1 + i) % state.players;
    return [seat, seat === taker ? contract : { type: 'bid', contract: 'pass' }];
  });
  return playOut(state, moves);
}
