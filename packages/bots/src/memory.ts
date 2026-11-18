import {
  EXCUSE,
  isTrump,
  suitOf,
  type Card,
  type CurrentTrick,
  type PlayedCard,
  type PlayerView,
  type Suit,
  type Trick,
} from '@tarot/engine';

/** A suit, or 'T' for trumps. */
export type Colour = Suit | 'T';

/**
 * What a bot remembers of a deal (JSON-serialisable). A seat plays once per trick, so between
 * two of its turns at most one trick completes: the last trick in its view is the only one it
 * may not have recorded yet.
 */
export interface BotMemory {
  /** Completed tricks seen, in order; complete when it holds every trick of the deal so far. */
  readonly tricks: readonly Trick[];
  /** Every card seen played this deal (recorded tricks, then the current one). */
  readonly played: readonly Card[];
  /** Per seat, the colours that seat showed it lacks (it did not follow). */
  readonly voids: readonly (readonly Colour[])[];
}

export const emptyMemory = (): BotMemory => ({ tricks: [], played: [], voids: [] });

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

/** Tricks completed so far in the deal the view shows. */
export const completedTricks = (view: PlayerView) => view.tricksWon.reduce((sum, n) => sum + n, 0);

/**
 * The memory a seat has after seeing these tricks: public information, since every seat sees
 * every trick. The room server uses it for a bot standing in for a player mid-deal.
 */
export function memoryFromTricks(
  players: number,
  tricks: readonly Trick[],
  currentTrick: CurrentTrick | null,
): BotMemory {
  const played: Card[] = [];
  const voids: Colour[][] = Array.from({ length: players }, () => []);
  for (const trick of [...tricks.map((t) => t.cards), currentTrick?.cards ?? []]) {
    trick.forEach(({ seat, card }, i) => {
      played.push(card);
      for (const colour of provenVoids(trick.slice(0, i), card)) {
        if (!voids[seat]?.includes(colour)) voids[seat]?.push(colour);
      }
    });
  }
  return { tricks, played, voids };
}

/** Whether the memory holds every trick completed so far: Difficile needs the whole history. */
export const knowsEveryTrick = (memory: BotMemory, completed: number) =>
  memory.tricks.length === completed;

/**
 * Whether `remember` can bring the memory up to date: it may only miss the last trick, which
 * the view still shows. A memory saved before tricks were remembered never can.
 */
export function canCatchUp(memory: BotMemory, completed: number): boolean {
  if (!Array.isArray(memory.tricks)) return false;
  const known = memory.tricks.length;
  return known === completed || known === completed - 1;
}

/** Whether two tricks of one deal are the same: a card is played only once in a deal. */
const sameTrick = (a: Trick | undefined, b: Trick) => a?.cards[0]?.card === b.cards[0]?.card;

/**
 * Adds what the view shows to the memory. A deal not yet in play starts a fresh memory, and so
 * does a memory holding more tricks than this deal has had: it belongs to a previous deal (a
 * seat may first act during play, after a Garde contre ended the bidding before its turn).
 */
export function remember(previous: BotMemory, view: PlayerView): BotMemory {
  if (view.phase !== 'playing') return emptyMemory();
  const known = previous.tricks.length > completedTricks(view) ? [] : previous.tricks;
  const last = view.lastTrick;
  const tricks = last === null || sameTrick(known.at(-1), last) ? known : [...known, last];
  return memoryFromTricks(view.players, tricks, view.currentTrick);
}
