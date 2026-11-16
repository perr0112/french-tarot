import { KNIGHT, QUEEN, suitOf, type Card } from '@tarot/engine';

/**
 * Moyen calls the card it does not hold in the suit where it has the most court cards
 * (Dame, then Cavalier), then the longest suit.
 */
export function chooseCalledCard(callable: readonly Card[], hand: readonly Card[]): Card {
  const suitCards = (card: Card) => hand.filter((c) => suitOf(c) === suitOf(card));
  const honours = (card: Card) =>
    suitCards(card).reduce(
      (sum, c) => sum + (c.endsWith(String(QUEEN)) ? 3 : c.endsWith(String(KNIGHT)) ? 2 : 0),
      0,
    );
  const candidates = callable.filter((c) => !hand.includes(c));
  const pool = candidates.length > 0 ? candidates : callable;
  const best = [...pool].sort(
    (a, b) => honours(b) - honours(a) || suitCards(b).length - suitCards(a).length,
  )[0];
  if (best === undefined) throw new Error('No card to call');
  return best;
}
