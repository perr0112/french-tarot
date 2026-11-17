import {
  EXCUSE,
  SUITS,
  isTrump,
  rankOf,
  suitOf,
  trumpValue,
  type Card,
  type Suit,
} from '@tarot/engine';

const RED: ReadonlySet<Suit> = new Set(['H', 'D']);

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

/** Suit order with as few same-colour neighbours as possible, ♠ ♥ ♣ ♦ breaking ties. */
function suitOrder(present: readonly Suit[]): Suit[] {
  const clashes = (order: readonly Suit[]) =>
    order.slice(1).filter((suit, i) => RED.has(suit) === RED.has(order[i] as Suit)).length;
  // Permutations come out in the base order's lexicographic order, so the first best one wins ties.
  return permutations(present).reduce((best, order) =>
    clashes(order) < clashes(best) ? order : best,
  );
}

/** A hand in display order: suits alternating red and black, by rank; trumps by number; the Excuse last. */
export function sortHand(hand: readonly Card[]): Card[] {
  const present = SUITS.filter((suit) => hand.some((card) => suitOf(card) === suit));
  const order = present.length > 0 ? suitOrder(present) : [];
  const key = (card: Card): number => {
    if (card === EXCUSE) return 10_000;
    if (isTrump(card)) return 1_000 + (trumpValue(card) ?? 0);
    return order.indexOf(suitOf(card) as Suit) * 100 + (rankOf(card) ?? 0);
  };
  return [...hand].sort((a, b) => key(a) - key(b));
}
