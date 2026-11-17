import { EXCUSE, rankOf, suitOf, trumpValue, type Card } from '@tarot/engine';
import { fr } from '../strings/fr';

/** A card's name in French, for labels and screen readers ("Roi de cœur", "Atout 21"). */
export function cardName(card: Card): string {
  if (card === EXCUSE) return fr.cards.excuse;
  const trump = trumpValue(card);
  if (trump !== null) return fr.cards.trump(trump);
  const rank = rankOf(card) ?? 0;
  const suit = fr.cards.suit[suitOf(card) ?? 'S'];
  return `${fr.cards.rank[rank] ?? rank} de ${suit}`;
}

/** The short rank shown in a card's corner (1–10, V, C, D, R, or the trump number). */
export function cornerLabel(card: Card): string {
  const trump = trumpValue(card);
  if (trump !== null) return String(trump);
  const rank = rankOf(card) ?? 0;
  return fr.cards.corner[rank] ?? String(rank);
}

/** French decimal points ("47,5"). */
export const formatPoints = (points: number) => String(points).replace('.', ',');

/** Signed score ("+56", "−28", "0"). */
export const formatScore = (score: number) =>
  score > 0 ? `+${score}` : score < 0 ? `−${Math.abs(score)}` : '0';
