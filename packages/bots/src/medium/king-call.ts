import { KNIGHT, QUEEN, rankOf, suitOf, type Card } from '@tarot/engine';

/**
 * Moyen calls the card it does not hold in the suit where it has the most court cards
 * (Dame, then Cavalier), then the longest suit.
 */
export function chooseCalledCard(callable: readonly Card[], hand: readonly Card[]): Card {
  const suitCards = (card: Card) => hand.filter((c) => suitOf(c) === suitOf(card));
  const courtCards = (card: Card) =>
    suitCards(card).reduce(
      (sum, c) => sum + (rankOf(c) === QUEEN ? 3 : rankOf(c) === KNIGHT ? 2 : 0),
      0,
    );
  const candidates = callable.filter((c) => !hand.includes(c));
  const pool = candidates.length > 0 ? candidates : callable;
  const best = [...pool].sort(
    (a, b) => courtCards(b) - courtCards(a) || suitCards(b).length - suitCards(a).length,
  )[0];
  if (best === undefined) throw new Error('No card to call');
  return best;
}
