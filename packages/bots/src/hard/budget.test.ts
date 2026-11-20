import { applyAction, createDeal, createRng, getPlayerView, type PlayerCount } from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { createBot } from '../index';
import { emptyMemory, type BotMemory } from '../memory';
import { bestCard } from './index';
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

describe('a Difficile decision', () => {
  const medium = createBot('medium');

  it.each([3, 4, 5] as const)(
    'never plays more simulated cards than the budget (%i players)',
    (players: PlayerCount) => {
      let decisions = 0;
      for (let seed = 1; seed <= 4; seed++) {
        let state = createDeal({ players, dealer: seed % players, seed });
        const memories: BotMemory[] = Array.from({ length: players }, emptyMemory);
        while (state.turn !== null) {
          const seat = state.turn;
          const view = getPlayerView(state, seat);
          const { action, memory } = medium.decide(
            view,
            memories[seat] ?? emptyMemory(),
            createRng(seed),
          );
          const [template] = view.legalActions;
          if (
            template?.type === 'playCard' &&
            action.type === 'playCard' &&
            template.cards.length > 1
          ) {
            const { simulatedCards } = bestCard(
              view,
              memory,
              action,
              template.cards,
              createRng(seed),
            );
            expect(simulatedCards).toBeLessThanOrEqual(SIMULATED_CARDS);
            if (simulatedCards > 0) decisions++;
          }
          memories[seat] = memory;
          const result = applyAction(state, seat, action);
          if (!result.ok) throw new Error(result.error.code);
          state = result.state;
        }
      }
      // Some decisions late in the deals did simulate.
      expect(decisions).toBeGreaterThan(0);
    },
  );
});
