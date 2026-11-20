import { ALL_CARDS, EXCUSE, isTrump, type Card } from './cards';
import { createDealFromHands, type CreateDealInput, type DealState, type Seat } from './deal';
import { createRng, shuffle } from './rng';
import { variantFor } from './variant';

/** Draws until no other hand holds a petit sec, which would cancel the deal at once. */
const ATTEMPTS = 50;

export interface CreateFavouredDealInput extends CreateDealInput {
  /** The seat that gets the exceptional hand. */
  readonly seat: Seat;
}

/** The trumps always in the favoured hand; the others are drawn among the lower ones. */
const TOP_TRUMPS: readonly Card[] = ['T21', 'T20', 'T19', 'T18'];
const TRUMPS = 11;

/**
 * A deal where `seat` holds a strong but believable hand (AGENTS.md §5, the host code): 11
 * trumps including the 21, 20, 19 and 18, the Excuse, and plain suit cards, high or low, for
 * the rest (3 in 5 players). The other seven trumps, the plain cards and every other hand come
 * from `seed`: never twice the same, always reproducible. The hands are composed, not dealt
 * packet by packet as createDeal does; a draw that gives another hand a petit sec is drawn
 * again, and after ATTEMPTS the last draw is kept, cancelled or not.
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
  const lowerTrumps = ALL_CARDS.filter((c) => isTrump(c) && !TOP_TRUMPS.includes(c));
  const plain = ALL_CARDS.filter((c) => !isTrump(c) && c !== EXCUSE);
  const draw = (): DealState => {
    const trumps = [
      ...TOP_TRUMPS,
      ...shuffle(lowerTrumps, rng).slice(0, TRUMPS - TOP_TRUMPS.length),
    ];
    const hand = [...trumps, EXCUSE];
    hand.push(...shuffle(plain, rng).slice(0, cardsPerPlayer - hand.length));
    const rest = shuffle(
      ALL_CARDS.filter((c) => !hand.includes(c)),
      rng,
    );
    const hands = Array.from({ length: players }, (_, s) =>
      s === seat ? hand : rest.splice(0, cardsPerPlayer),
    );
    return createDealFromHands({
      hands,
      chien: rest.splice(0, chienSize),
      dealer,
      ...(options ? { options } : {}),
    });
  };
  let deal = draw();
  for (let attempt = 1; attempt < ATTEMPTS && deal.phase !== 'bidding'; attempt++) deal = draw();
  return deal;
}
