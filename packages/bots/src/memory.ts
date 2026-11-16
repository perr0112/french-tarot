import {
  EXCUSE,
  isTrump,
  suitOf,
  type Card,
  type PlayedCard,
  type PlayerView,
  type Suit,
} from '@tarot/engine';

/** A suit, or 'T' for trumps. */
export type Colour = Suit | 'T';

/**
 * What a bot remembers of a deal (JSON-serialisable). A seat plays once per trick, so between
 * two of its turns at most one trick completes: the last trick and the current one in its view
 * hold every card played since its previous turn.
 */
export interface BotMemory {
  /** Every card seen played this deal. */
  readonly played: readonly Card[];
  /** Per seat, the colours that seat showed it lacks (it did not follow). */
  readonly voids: readonly (readonly Colour[])[];
}

export const emptyMemory = (): BotMemory => ({ played: [], voids: [] });

export const colourOf = (card: Card): Colour | null =>
  card === EXCUSE ? null : isTrump(card) ? 'T' : suitOf(card);

/** Colours a card proves its player lacks, given the cards already in the trick. */
function provenVoids(before: readonly PlayedCard[], card: Card): Colour[] {
  const led = before.find((p) => p.card !== EXCUSE)?.card;
  const ledColour = led === undefined ? null : colourOf(led);
  const colour = colourOf(card);
  if (ledColour === null || colour === null || colour === ledColour) return [];
  return colour === 'T' ? [ledColour] : [...new Set([ledColour, 'T' as const])];
}

/** Cards played so far in the deal the view shows. */
const playedSoFar = (view: PlayerView) =>
  view.tricksWon.reduce((sum, n) => sum + n, 0) * view.players +
  (view.currentTrick?.cards.length ?? 0);

/**
 * Adds what the view shows to the memory. A deal not yet in play starts a fresh memory, and so
 * does a memory holding more cards than this deal has seen: it belongs to a previous deal (a seat
 * may first act during play, after a Garde contre ended the bidding before its turn).
 */
export function remember(previous: BotMemory, view: PlayerView): BotMemory {
  if (view.phase !== 'playing') return emptyMemory();
  const memory = previous.played.length > playedSoFar(view) ? emptyMemory() : previous;
  const played = [...memory.played];
  const voids = Array.from({ length: view.players }, (_, s) => [...(memory.voids[s] ?? [])]);
  for (const trick of [view.lastTrick?.cards ?? [], view.currentTrick?.cards ?? []]) {
    trick.forEach(({ seat, card }, i) => {
      if (played.includes(card)) return;
      played.push(card);
      for (const colour of provenVoids(trick.slice(0, i), card)) {
        if (!voids[seat]?.includes(colour)) voids[seat]?.push(colour);
      }
    });
  }
  return { played, voids };
}
