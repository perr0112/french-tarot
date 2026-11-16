/**
 * Bot strategies (Facile / Moyen) behind a common `Bot` interface.
 * Bots only see the redacted player view and use the engine's legal actions.
 */
import type { Bot, BotLevel } from './bot';
import { easyBot } from './easy';
import { mediumBot } from './medium';

export type { Bot, BotDecision, BotLevel } from './bot';
export { emptyMemory, type BotMemory } from './memory';
export { simulateDeal, type SimulateDealInput } from './simulate';

const BOTS: Readonly<Record<BotLevel, Bot>> = { easy: easyBot, medium: mediumBot };

export function createBot(level: BotLevel): Bot {
  return BOTS[level];
}
