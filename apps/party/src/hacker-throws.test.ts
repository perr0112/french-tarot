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

const throws = (h: RoomHarness, connection: string) =>
  h.messages(connection).filter((m) => m.type === 'throw');

describe('the hacker name', () => {
  it('is turned on and off by its player, and everyone sees it', () => {
    const h = new RoomHarness();
    h.join('c0', 'Alice');
    h.join('c1', 'Bob');
    h.send('c1', { type: 'hacker' });
    expect(h.view('c0').seats[1]).toMatchObject({ nickname: 'Bob', hacker: true });
    h.send('c1', { type: 'hacker' });
    expect(h.view('c0').seats[1]).toMatchObject({ hacker: false });
  });
});

describe('throwing something at a player', () => {
  it('shows everyone who threw what at whom', () => {
    const h = twoAtTable();
    h.send('c0', { type: 'throw', target: 2, item: 'cake' });
    for (const c of ['c0', 'c1']) {
      expect(throws(h, c)).toEqual([{ type: 'throw', from: 0, to: 2, item: 'cake' }]);
    }
    expect(h.lastPersist).toBe(false);
  });

  it('lets each player throw once every three seconds', () => {
    const h = twoAtTable();
    h.send('c0', { type: 'throw', target: 1, item: 'tomato' });
    h.send('c0', { type: 'throw', target: 1, item: 'tomato' });
    expect(throws(h, 'c1')).toHaveLength(1);
    h.advance(3000);
    h.send('c0', { type: 'throw', target: 1, item: 'balloon' });
    expect(throws(h, 'c1')).toHaveLength(2);
  });

  it('never at oneself, nor at a seat that is not there', () => {
    const h = twoAtTable();
    h.send('c0', { type: 'throw', target: 0, item: 'fish' });
    expect(h.lastError('c0')).toBe('SEAT_INVALID');
    h.send('c0', { type: 'throw', target: 7, item: 'fish' });
    expect(h.lastError('c0')).toBe('SEAT_INVALID');
    expect(throws(h, 'c1')).toHaveLength(0);
  });
});
