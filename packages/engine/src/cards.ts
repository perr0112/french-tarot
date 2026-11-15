/** Card identities and values (ADR-0001). Points are counted in half-points. */

export const SUITS = ['S', 'H', 'D', 'C'] as const;
export type Suit = (typeof SUITS)[number];

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type SuitRank = `0${Exclude<Digit, '0'>}` | '10' | '11' | '12' | '13' | '14';
type TrumpRank = `0${Exclude<Digit, '0'>}` | `1${Digit}` | '20' | '21';

export type SuitCard = `${Suit}${SuitRank}`;
export type TrumpCard = `T${TrumpRank}`;
export type Card = SuitCard | TrumpCard | 'EXC';

export const EXCUSE = 'EXC' satisfies Card;
export const PETIT = 'T01' satisfies Card;
export const TWENTY_ONE = 'T21' satisfies Card;

export const JACK = 11;
export const KNIGHT = 12;
export const QUEEN = 13;
export const KING = 14;

const pad = (n: number): string => n.toString().padStart(2, '0');

export const ALL_CARDS: readonly Card[] = [
  ...SUITS.flatMap((suit) =>
    Array.from({ length: 14 }, (_, i) => `${suit}${pad(i + 1)}` as SuitCard),
  ),
  ...Array.from({ length: 21 }, (_, i) => `T${pad(i + 1)}` as TrumpCard),
  EXCUSE,
];

export function isTrump(card: Card): card is TrumpCard {
  return card.startsWith('T');
}

export function suitOf(card: Card): Suit | null {
  return card === EXCUSE || isTrump(card) ? null : (card[0] as Suit);
}

/** Rank of a suit card (1–14), or null for trumps and the Excuse. */
export function rankOf(card: Card): number | null {
  return suitOf(card) === null ? null : Number(card.slice(1));
}

/** Value of a trump (1–21), or null for any other card. */
export function trumpValue(card: Card): number | null {
  return isTrump(card) ? Number(card.slice(1)) : null;
}

export function isOudler(card: Card): boolean {
  return card === EXCUSE || card === PETIT || card === TWENTY_ONE;
}

const HALF_POINTS_BY_RANK: Record<number, number> = { [KING]: 9, [QUEEN]: 7, [KNIGHT]: 5, [JACK]: 3 };

export function cardHalfPoints(card: Card): number {
  if (isOudler(card)) return 9;
  return HALF_POINTS_BY_RANK[rankOf(card) ?? 0] ?? 1;
}
