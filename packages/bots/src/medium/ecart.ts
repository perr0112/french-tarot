import {
  KING,
  cardHalfPoints,
  isTrump,
  rankOf,
  suitOf,
  trumpValue,
  type Card,
  type LegalAction,
  type Suit,
} from '@tarot/engine';

type EcartTemplate = Extract<LegalAction, { type: 'ecart' }>;

/**
 * Moyen's écart: cut short suits without a King, then save the court cards of short suits,
 * then low cards. Never cuts the called suit (5 players), so the partner can be reached.
 * Trumps only when the engine says they are unavoidable, the lowest first.
 */
export function chooseEcart(
  template: EcartTemplate,
  hand: readonly Card[],
  calledCard: Card | null,
): Card[] {
  const plain = template.eligible.filter((c) => !isTrump(c));
  if (template.trumpsAllowed) {
    const trumps = template.eligible
      .filter(isTrump)
      .sort((a, b) => (trumpValue(a) ?? 0) - (trumpValue(b) ?? 0));
    return [...plain, ...trumps].slice(0, template.count);
  }

  const calledSuit = calledCard === null ? null : suitOf(calledCard);
  const suitCards = (suit: Suit) => hand.filter((c) => suitOf(c) === suit);
  const hasKing = (suit: Suit) => suitCards(suit).some((c) => rankOf(c) === KING);
  const lengthOf = (card: Card) => suitCards(suitOf(card) as Suit).length;

  const chosen: Card[] = [];
  const cuttable = [...new Set(plain.map((c) => suitOf(c) as Suit))]
    .filter((suit) => suit !== calledSuit && !hasKing(suit))
    .sort((a, b) => suitCards(a).length - suitCards(b).length);
  for (const suit of cuttable) {
    const cards = suitCards(suit);
    if (cards.length <= template.count - chosen.length) chosen.push(...cards);
  }

  const group = (card: Card) => {
    const suit = suitOf(card) as Suit;
    return suit === calledSuit ? 2 : hasKing(suit) ? 1 : 0;
  };
  const rest = plain
    .filter((c) => !chosen.includes(c))
    .sort(
      (a, b) =>
        group(a) - group(b) ||
        lengthOf(a) - lengthOf(b) ||
        cardHalfPoints(b) - cardHalfPoints(a) ||
        (rankOf(b) ?? 0) - (rankOf(a) ?? 0),
    );
  return [...chosen, ...rest].slice(0, template.count);
}
