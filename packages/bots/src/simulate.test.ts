import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createBot, simulateDeal, type BotLevel } from './index';

const levels: readonly BotLevel[] = ['easy', 'medium'];

describe.each([3, 4, 5] as const)('bot-only deals (%i players)', (players) => {
  it('always end, the engine never refusing a bot action', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.integer({ min: 0, max: players - 1 }),
        fc.array(fc.constantFrom(...levels), { minLength: players, maxLength: players }),
        (seed, dealer, seatLevels) => {
          const end = simulateDeal({ players, dealer, seed, bots: seatLevels.map(createBot) });
          expect(['finished', 'cancelled']).toContain(end.phase);
        },
      ),
      { numRuns: 100 },
    );
  });
});
