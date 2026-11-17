import { describe, expect, it, vi } from 'vitest';
import { RoomHarness } from './testing/harness';

// A bot that always proposes an action the engine refuses.
vi.mock('@tarot/bots', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tarot/bots')>();
  return {
    ...actual,
    createBot: () => ({
      level: 'medium',
      decide: (_view: unknown, memory: unknown) => ({
        action: { type: 'callKing', card: 'S14' },
        memory,
      }),
    }),
  };
});

describe('a bot whose action the engine refuses', () => {
  it('plays a legal action instead, so the table never freezes', () => {
    const h = new RoomHarness();
    h.join('c0', 'Alice');
    [1, 2, 3].forEach((seat) => h.send('c0', { type: 'setBot', seat, level: 'medium' }));
    h.send('c0', { type: 'start' });
    while (h.view('c0').deal?.turn === 0) {
      h.send('c0', { type: 'action', action: { type: 'bid', contract: 'pass' } });
    }
    const bids = h.view('c0').deal?.bids.length ?? 0;
    expect(() => h.advance(1000)).not.toThrow();
    expect(h.view('c0').deal?.bids.length).toBe(bids + 1);
  });
});
