import {
  CONTRACTS,
  EXCUSE,
  KING,
  KNIGHT,
  PETIT,
  QUEEN,
  SUITS,
  TWENTY_ONE,
  isTrump,
  suitOf,
  trumpValue,
  variantFor,
  type Card,
  type Contract,
  type PlayerCount,
} from '@tarot/engine';

/** Points of a suit's court cards: King and Queen together are worth more than apart. */
function honourPoints(hand: readonly Card[], suit: string): number {
  const has = (rank: number) => hand.includes(`${suit}${rank}` as Card);
  const king = has(KING);
  const queen = has(QUEEN);
  return (king && queen ? 10 : king ? 6 : queen ? 3 : 0) + (has(KNIGHT) ? 2 : 0);
}

function lengthPoints(length: number): number {
  if (length === 0) return 5; // a cut
  if (length === 1) return 3; // a singleton
  if (length >= 7) return 7;
  return length >= 5 ? length : 0;
}

/**
 * Hand value by the method club players use: oudlers, trumps (major ones count more),
 * court cards, long and short suits.
 */
export function handValue(hand: readonly Card[]): number {
  const trumps = hand.filter(isTrump);
  const majors = trumps.filter((c) => (trumpValue(c) ?? 0) >= 16 && c !== TWENTY_ONE);
  let value = trumps.length + majors.length;
  if (hand.includes(TWENTY_ONE)) value += 10;
  if (hand.includes(EXCUSE)) value += 7;
  if (hand.includes(PETIT)) value += trumps.length - 1 >= 4 ? 8 : 3;
  for (const suit of SUITS) {
    const length = hand.filter((c) => suitOf(c) === suit).length;
    value += honourPoints(hand, suit) + lengthPoints(length);
  }
  return value;
}

/**
 * Value from which each contract is worth taking, for 18 cards (4 players). Calibrated on
 * random deals so that someone takes in about two deals out of three.
 */
const THRESHOLDS: Readonly<Record<Contract, number>> = {
  petite: 34,
  garde: 50,
  gardeSans: 66,
  gardeContre: 76,
};

/** The highest contract the hand is worth, scaled to the variant's hand size, or null. */
export function contractWorth(hand: readonly Card[], players: PlayerCount): Contract | null {
  const scale = variantFor(players).cardsPerPlayer / 18;
  const value = handValue(hand);
  return [...CONTRACTS].reverse().find((c) => value >= THRESHOLDS[c] * scale) ?? null;
}
