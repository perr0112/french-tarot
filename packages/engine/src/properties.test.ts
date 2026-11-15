import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ALL_CARDS, cardHalfPoints, createDeal, dealFacts } from './index';
import { playRandomly } from './testing/random-player';

const seeds = (players: number) =>
  fc.tuple(
    fc.integer({ min: 0, max: 2 ** 31 - 1 }),
    fc.integer({ min: 0, max: players - 1 }),
    fc.integer(),
  );

describe.each([3, 4, 5] as const)('random legal deals (%i players)', (players) => {
  it('always end, finished or cancelled, never refusing a legal action', () => {
    fc.assert(
      fc.property(seeds(players), ([seed, dealer, choiceSeed]) => {
        const end = playRandomly(createDeal({ players, dealer, seed }), choiceSeed);
        expect(['finished', 'cancelled']).toContain(end.phase);
      }),
      { numRuns: 200 },
    );
  });

  it('conserve the 78 cards, the 91 points, and score to zero', () => {
    fc.assert(
      fc.property(seeds(players), ([seed, dealer, choiceSeed]) => {
        const end = playRandomly(createDeal({ players, dealer, seed }), choiceSeed);
        if (end.phase !== 'finished' || end.result === null) return;

        const aside = end.contract === 'petite' || end.contract === 'garde' ? end.ecart : end.chien;
        const cards = [...end.tricks.flatMap((t) => t.cards.map((p) => p.card)), ...aside];
        expect([...cards].sort()).toEqual([...ALL_CARDS].sort());
        expect(cards.reduce((sum, c) => sum + cardHalfPoints(c), 0)).toBe(182);

        const facts = dealFacts(end);
        expect(facts.takerHalfPoints).toBeGreaterThanOrEqual(0);
        expect(facts.takerHalfPoints).toBeLessThanOrEqual(182);
        expect(facts.takerOudlers).toBeLessThanOrEqual(3);
        expect(end.result.perSeat.reduce((a, b) => a + b, 0)).toBe(0);
      }),
      { numRuns: 200 },
    );
  });
});
