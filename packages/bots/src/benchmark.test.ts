// Tests run on Node, which provides the timing API without the DOM library's types.
declare const performance: { now(): number };
import { describe, expect, it } from 'vitest';
import { createBot, simulateDeal, type Bot } from './index';

const medium = createBot('medium');
const easy = createBot('easy');

/** Total score of the Moyen seats over fixed-seed deals, Moyen and Facile alternating. */
function mediumScore(players: 3 | 4 | 5, deals: number): { total: number; played: number } {
  const bots = Array.from({ length: players }, (_, seat) => (seat % 2 === 0 ? medium : easy));
  let total = 0;
  let played = 0;
  for (let i = 0; i < deals; i++) {
    // Swap which seats Moyen holds every other deal, so seating does not favour it.
    const seated = i % 2 === 0 ? bots : [...bots.slice(1), bots[0] as Bot];
    const end = simulateDeal({ players, dealer: i % players, seed: 1000 + i, bots: seated });
    if (end.result === null) continue;
    played++;
    end.result.perSeat.forEach((score, seat) => {
      if (seated[seat] === medium) total += score;
    });
  }
  return { total, played };
}

describe('Moyen against Facile (fixed seeds)', () => {
  it.each([3, 4, 5] as const)('scores more on average in %i players', (players) => {
    const { total, played } = mediumScore(players, 200);
    expect(played).toBeGreaterThan(50);
    expect(total / played).toBeGreaterThan(0);
  });
});

describe('decision time', () => {
  it('stays well under the 1 s target per decision', () => {
    let slowest = 0;
    const timed: Bot = {
      level: medium.level,
      decide(view, memory, rng) {
        const start = performance.now();
        const decision = medium.decide(view, memory, rng);
        slowest = Math.max(slowest, performance.now() - start);
        return decision;
      },
    };
    for (const players of [3, 4, 5] as const) {
      for (let seed = 0; seed < 20; seed++) {
        simulateDeal({ players, dealer: 0, seed, bots: Array(players).fill(timed) });
      }
    }
    // Generous bound so a busy CI machine does not fail it; typical decisions take < 1 ms.
    expect(slowest).toBeLessThan(200);
  });
});
