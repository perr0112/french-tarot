import type { Action, LegalAction, PlayerView, Rng } from '@tarot/engine';
import type { BotMemory } from './memory';

/** Difficulty of a bot; Facile and Moyen in the UI. Difficile comes with milestone 6. */
export type BotLevel = 'easy' | 'medium';

export interface BotDecision {
  readonly action: Action;
  /** The memory to hand back on this seat's next decision. */
  readonly memory: BotMemory;
}

/**
 * A bot plays one seat from what that seat may know: its redacted view, the memory it kept
 * from its earlier turns, and an injected random source. Pure and synchronous.
 */
export interface Bot {
  readonly level: BotLevel;
  decide(view: PlayerView, memory: BotMemory, rng: Rng): BotDecision;
}

/** The single action template a bot must answer; asking a bot out of turn is a caller bug. */
export function legalTemplate(view: PlayerView): LegalAction {
  const [template] = view.legalActions;
  if (!template) throw new Error(`Seat ${view.seat} has nothing to do in ${view.phase}`);
  return template;
}

export function pickOne<T>(items: readonly T[], rng: Rng): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('Cannot pick from an empty list');
  return item;
}

export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
