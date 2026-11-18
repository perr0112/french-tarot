import {
  applyAction,
  createDeal,
  createRng,
  getPlayerView,
  type DealState,
  type PlayerCount,
} from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { createBot, emptyMemory, memoryFromTricks, type BotMemory } from './index';
import { canCatchUp, knowsEveryTrick } from './memory';

const medium = createBot('medium');

/** Plays a Moyen-only deal, checking each memory in play against one rebuilt from the tricks. */
function checkDeal(players: PlayerCount, seed: number): number {
  let state: DealState = createDeal({ players, dealer: seed % players, seed });
  const memories: BotMemory[] = Array.from({ length: players }, emptyMemory);
  let checked = 0;
  while (state.turn !== null) {
    const seat = state.turn;
    const { action, memory } = medium.decide(
      getPlayerView(state, seat),
      memories[seat] ?? emptyMemory(),
      createRng(seed),
    );
    if (state.phase === 'playing') {
      expect(memoryFromTricks(players, state.tricks, state.currentTrick)).toEqual(memory);
      checked++;
    }
    memories[seat] = memory;
    const result = applyAction(state, seat, action);
    if (!result.ok) throw new Error(result.error.code);
    state = result.state;
  }
  return checked;
}

describe('memoryFromTricks', () => {
  it.each([3, 4, 5] as const)(
    'gives the memory a seat builds turn by turn (%i players)',
    (players) => {
      let checked = 0;
      for (let seed = 1; seed <= 15; seed++) checked += checkDeal(players, seed);
      expect(checked).toBeGreaterThan(100);
    },
  );

  it('records each completed trick with its winner', () => {
    const trick = {
      leader: 0,
      winner: 1,
      cards: [
        { seat: 0, card: 'S01' },
        { seat: 1, card: 'T02' },
        { seat: 2, card: 'S03' },
        { seat: 3, card: 'S04' },
      ],
    } as const;
    expect(memoryFromTricks(4, [trick], null)).toEqual({
      tricks: [trick],
      played: ['S01', 'T02', 'S03', 'S04'],
      voids: [[], ['S'], [], []],
    });
  });
});

describe('memory coverage', () => {
  const trick = { leader: 0, winner: 0, cards: [] } as const;
  const knowing = (n: number): BotMemory => ({ ...emptyMemory(), tricks: Array(n).fill(trick) });

  it('can catch up when only the trick still in view is missing', () => {
    expect(canCatchUp(knowing(3), 3)).toBe(true);
    expect(canCatchUp(knowing(2), 3)).toBe(true);
    expect(canCatchUp(knowing(1), 3)).toBe(false);
    expect(canCatchUp(knowing(4), 3)).toBe(false);
    expect(canCatchUp({ played: [], voids: [] } as unknown as BotMemory, 0)).toBe(false);
  });

  it('knows every trick only with the whole history', () => {
    expect(knowsEveryTrick(knowing(3), 3)).toBe(true);
    expect(knowsEveryTrick(knowing(2), 3)).toBe(false);
  });
});
