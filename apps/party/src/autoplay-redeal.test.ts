import { describe, expect, it } from 'vitest';
import { RoomHarness } from './testing/harness';

/** Alice alone with three bots, the session started. */
function aloneWithBots(): RoomHarness {
  const h = new RoomHarness();
  h.join('c0', 'Alice');
  [1, 2, 3].forEach((seat) => h.send('c0', { type: 'setBot', seat, level: 'medium' }));
  h.send('c0', { type: 'start' });
  return h;
}

describe('autoplay', () => {
  it('lets a bot take every decision of the seat, shown to all, until turned off', () => {
    const h = new RoomHarness();
    h.join('c0', 'Alice');
    h.join('c1', 'Bob');
    [2, 3].forEach((seat) => h.send('c0', { type: 'setBot', seat, level: 'medium' }));
    h.send('c0', { type: 'start' });
    h.send('c0', { type: 'autoplay', on: true });
    expect(h.view('c1').seats[0]).toMatchObject({ autoplay: true, replacedByBot: false });
    // Bob plays his turns by hand; Alice's are played for her, to the deal's end.
    for (let step = 0; step < 500 && h.view('c1').session?.history.length === 0; step++) {
      const deal = h.view('c1').deal;
      const template = deal?.turn === 1 ? deal.legalActions[0] : undefined;
      if (template?.type === 'bid') {
        h.send('c1', { type: 'action', action: { type: 'bid', contract: 'pass' } });
      } else if (template?.type === 'playCard') {
        h.send('c1', {
          type: 'action',
          action: { type: 'playCard', card: template.cards[0] ?? 'EXC' },
        });
      } else if (template) {
        throw new Error(`unexpected ${template.type}`);
      } else h.advance(5000);
    }
    expect(h.view('c1').session?.history).toHaveLength(1);
    h.send('c0', { type: 'autoplay', on: false });
    expect(h.view('c1').seats[0]).toMatchObject({ autoplay: false });
  });

  it('does not wait for the seat to continue to the next deal', () => {
    const h = aloneWithBots();
    h.send('c0', { type: 'autoplay', on: true });
    for (let step = 0; step < 200 && (h.view('c0').session?.history.length ?? 0) < 2; step++) {
      h.advance(5000);
    }
    expect(h.view('c0').session?.history.length).toBeGreaterThanOrEqual(2);
  });
});

describe('redealing', () => {
  it('gives a lone player among bots a new deal from the same dealer, unrecorded', () => {
    const h = aloneWithBots();
    const before = h.view('c0');
    h.send('c0', { type: 'redeal' });
    const after = h.view('c0');
    expect(after.deal?.hand).not.toEqual(before.deal?.hand);
    expect(after.deal?.dealer).toBe(before.deal?.dealer);
    expect(after.deal?.bids).toEqual([]);
    expect(after.session?.history).toEqual([]);
  });

  it('is refused with another player at the table', () => {
    const h = new RoomHarness();
    h.join('c0', 'Alice');
    h.join('c1', 'Bob');
    [2, 3].forEach((seat) => h.send('c0', { type: 'setBot', seat, level: 'medium' }));
    h.send('c0', { type: 'start' });
    h.send('c0', { type: 'redeal' });
    expect(h.lastError('c0')).toBe('REDEAL_NOT_ALLOWED');
  });
});
