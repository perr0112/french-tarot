import { describe, expect, it } from 'vitest';
import { RoomHarness } from './testing/harness';

function twoAtTable(): RoomHarness {
  const h = new RoomHarness();
  h.join('c0', 'Alice');
  h.join('c1', 'Bob');
  [2, 3].forEach((seat) => h.send('c0', { type: 'setBot', seat, level: 'medium' }));
  h.send('c0', { type: 'start' });
  return h;
}

const reactions = (h: RoomHarness, connection: string) =>
  h.messages(connection).filter((m) => m.type === 'reaction');

describe('reactions', () => {
  it('shows a player’s reaction to everyone at the table, with their seat', () => {
    const h = twoAtTable();
    h.send('c1', { type: 'react', emoji: '😂' });
    for (const connection of ['c0', 'c1']) {
      expect(reactions(h, connection)).toEqual([{ type: 'reaction', seat: 1, emoji: '😂' }]);
    }
  });

  it('lets each player react once every two seconds', () => {
    const h = twoAtTable();
    h.send('c1', { type: 'react', emoji: '👏' });
    h.send('c1', { type: 'react', emoji: '🎉' });
    h.send('c0', { type: 'react', emoji: '😮' });
    expect(reactions(h, 'c0')).toHaveLength(2);
    h.advance(2000);
    h.send('c1', { type: 'react', emoji: '🎉' });
    expect(reactions(h, 'c0')).toHaveLength(3);
  });

  it('is only for the players seated at a table in play', () => {
    const h = new RoomHarness();
    h.join('c0', 'Alice');
    h.send('c0', { type: 'react', emoji: '😂' });
    expect(h.lastError('c0')).toBe('WRONG_ROOM_PHASE');
  });
});
