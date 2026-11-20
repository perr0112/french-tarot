import { describe, expect, it } from 'vitest';
import { SIMULATED_CARDS, samplesFor } from './budget';

describe('samplesFor', () => {
  it('plays Moyen’s card while not even one sampled deal fits the budget', () => {
    // First trick in 4 players: 72 cards left, a playout per playable card.
    expect(samplesFor(4, 72)).toBe(0);
  });

  it('samples as many deals as the budget allows near the end of a deal', () => {
    // Last tricks: 12 cards left, three playable cards (36 cards a sampled deal).
    expect(samplesFor(3, 12)).toBe(Math.floor(SIMULATED_CARDS / 36));
  });

  it('never simulates more cards than the budget, and never more than 20 deals', () => {
    for (let playable = 2; playable <= 18; playable++) {
      for (let left = playable; left <= 78; left++) {
        const samples = samplesFor(playable, left);
        expect(samples * playable * left).toBeLessThanOrEqual(SIMULATED_CARDS);
        expect(samples).toBeLessThanOrEqual(20);
      }
    }
  });
});
