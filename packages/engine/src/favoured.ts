import { ALL_CARDS, EXCUSE, KING, SUITS, isTrump, trumpValue, type Card } from './cards';
import { createDealFromHands, type CreateDealInput, type DealState, type Seat } from './deal';
import { createRng, shuffle } from './rng';
import { variantFor } from './variant';

/** Draws until no other hand holds a petit sec, which would cancel the deal at once. */
const ATTEMPTS = 50;

export interface CreateFavouredDealInput extends CreateDealInput {
  /** The seat that gets the exceptional hand. */
  readonly seat: Seat;
}

/**
 * A deal where `seat` holds an exceptional hand (AGENTS.md §5, the host code): 12 trumps
 * including the 21, 20 and 19, the Excuse and two Kings — the whole hand in 5 players,
 * completed with random cards (perhaps more trumps or Kings) in 3 and 4. The other nine trumps,
 * the Kings' suits, the rest of the hand and every other hand come from `seed`: never twice the
 * same, always reproducible. The hands are composed, not dealt packet by packet as createDeal
 * does; a draw that gives another hand a petit sec is drawn again.
 */
export function createFavouredDeal({
  players,
  dealer,
  seed,
  seat,
  options,
}: CreateFavouredDealInput): DealState {
  const rng = createRng(seed);
  const { cardsPerPlayer, chienSize } = variantFor(players);
  const lowTrumps = ALL_CARDS.filter((c) => isTrump(c) && (trumpValue(c) ?? 0) <= 18);
  let deal: DealState | null = null;
  for (let attempt = 0; attempt < ATTEMPTS && deal?.phase !== 'bidding'; attempt++) {
    const kings = shuffle(SUITS, rng)
      .slice(0, 2)
      .map((suit) => `${suit}${KING}` as Card);
    const core: Card[] = [
      'T21',
      'T20',
      'T19',
      ...shuffle(lowTrumps, rng).slice(0, 9),
      EXCUSE,
      ...kings,
    ];
    const rest = shuffle(
      ALL_CARDS.filter((c) => !core.includes(c)),
      rng,
    );
    const hand = [...core, ...rest.splice(0, cardsPerPlayer - core.length)];
    const hands = Array.from({ length: players }, (_, s) =>
      s === seat ? hand : rest.splice(0, cardsPerPlayer),
    );
    deal = createDealFromHands({
      hands,
      chien: rest.splice(0, chienSize),
      dealer,
      ...(options ? { options } : {}),
    });
  }
  return deal as DealState;
}
