/**
 * Bot strategies (Facile / Moyen / Difficile) behind a common `Bot` interface.
 * Bots only see the redacted player view and use the engine's legal actions.
 */
import type { Bot, BotLevel } from './bot';
import { easyBot } from './easy';
import { hardBot } from './hard';
import { mediumBot } from './medium';

export type { Bot, BotDecision, BotLevel } from './bot';
export { canCatchUp, emptyMemory, memoryFromTricks, type BotMemory } from './memory';
export { simulateDeal, type SimulateDealInput } from './simulate';

const BOTS: Readonly<Record<BotLevel, Bot>> = {
  easy: easyBot,
  medium: mediumBot,
  hard: hardBot,
};

export function createBot(level: BotLevel): Bot {
  return BOTS[level];
}
