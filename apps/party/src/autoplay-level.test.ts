import { describe, expect, it, vi } from 'vitest';
import { RoomHarness } from './testing/harness';

// Records the level of every bot the room asks to decide.
const levels: string[] = [];
vi.mock('@tarot/bots', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tarot/bots')>();
  return {
    ...actual,
    createBot: (level: Parameters<typeof actual.createBot>[0]) => {
      levels.push(level);
      return actual.createBot(level);
    },
  };
});

describe('autoplay', () => {
  it('plays for the player as the Difficile bot', () => {
    const h = new RoomHarness();
    h.join('c0', 'Alice');
    [1, 2, 3].forEach((seat) => h.send('c0', { type: 'setBot', seat, level: 'easy' }));
    h.send('c0', { type: 'start' });
    h.send('c0', { type: 'autoplay', on: true });
    for (let step = 0; step < 50 && !levels.includes('hard'); step++) h.advance(2000);
    expect(levels).toContain('hard');
  });
});
