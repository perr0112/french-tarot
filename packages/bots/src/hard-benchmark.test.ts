// Tests run on Node, which provides these without the DOM library's types.
declare const performance: { now(): number };
declare const process: { env: Record<string, string | undefined> };
declare const console: { log(message: string): void };
import { describe, expect, it } from 'vitest';
import { createHardBot } from './hard';
import { SIMULATED_CARDS } from './hard/budget';
import { createBot, simulateDeal, type Bot } from './index';

const medium = createBot('medium');
// BENCH_SIMULATED_CARDS tries another budget than the one Difficile plays with.
const hard = createHardBot(Number(process.env.BENCH_SIMULATED_CARDS ?? SIMULATED_CARDS));

/** Wraps a bot to record its slowest and average decision time. */
function timed(bot: Bot) {
  const times: number[] = [];
  const wrapped: Bot = {
    level: bot.level,
    decide(view, memory, rng) {
      const start = performance.now();
      const decision = bot.decide(view, memory, rng);
      times.push(performance.now() - start);
      return decision;
    },
  };
  return { bot: wrapped, times };
}

/**
 * Difficile and Moyen alternating, seats swapped every other deal. Each deal is also played with
 * Moyen in Difficile's seats: the difference on the same cards is Difficile's gain per deal.
 */
function hardScore(players: 3 | 4 | 5, deals: number, first = 0) {
  const clock = timed(hard);
  const bots = Array.from({ length: players }, (_, seat) => (seat % 2 === 0 ? clock.bot : medium));
  const control = Array.from({ length: players }, () => medium);
  let total = 0;
  let played = 0;
  for (let i = first; i < first + deals; i++) {
    const seated = i % 2 === 0 ? bots : [...bots.slice(1), bots[0] as Bot];
    const input = { players, dealer: i % players, seed: 5000 + i };
    const end = simulateDeal({ ...input, bots: seated });
    const base = simulateDeal({ ...input, bots: control });
    if (end.result === null || base.result === null) continue;
    played++;
    seated.forEach((bot, seat) => {
      if (bot === clock.bot)
        total += (end.result?.perSeat[seat] ?? 0) - (base.result?.perSeat[seat] ?? 0);
    });
  }
  return { average: played ? total / played : 0, played, times: clock.times };
}

// The full benchmark takes minutes: run it with BENCH=1 (pnpm --filter @tarot/bots bench).
describe.runIf(process.env.BENCH)('Difficile against Moyen (fixed seeds)', () => {
  it.each([3, 4, 5] as const)(
    'scores more than Moyen would in its seats (%i players)',
    async (players) => {
      const { average, played, times } = hardScore(players, Number(process.env.BENCH_DEALS ?? 60));
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const line =
        `${players}p: ${average.toFixed(1)} per deal over ${played}; ` +
        `decision mean ${mean.toFixed(0)} ms, max ${Math.max(...times).toFixed(0)} ms`;
      console.log(line);
      // Vitest hides the logs of passing tests: BENCH_OUT keeps the numbers in a file.
      const out = process.env.BENCH_OUT;
      if (out) {
        const fs = (await import('node:fs' as string)) as {
          appendFileSync(path: string, data: string): void;
        };
        fs.appendFileSync(out, `${line}\n`);
      }
      expect(average).toBeGreaterThan(0);
      // Run alone, a decision takes a few milliseconds (budget.ts); the first ones also pay for
      // the JIT warming up.
      expect(Math.max(...times)).toBeLessThan(100);
    },
    3_600_000,
  );
});

describe('Difficile decision time', () => {
  it('stays well within the room server’s time, even on a busy machine', () => {
    const times = [3, 4, 5].flatMap((players) => hardScore(players as 3 | 4 | 5, 1).times);
    // The full suite runs files in parallel, which slows every decision; the benchmark, run
    // alone, checks the tighter bound (decisions take a few milliseconds).
    expect(Math.max(...times)).toBeLessThan(500);
  }, 60_000);
});
