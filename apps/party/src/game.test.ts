import type { Action, LegalAction } from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { BOT_DELAY_MS, EXPIRE_AFTER_MS, REPLACE_AFTER_MS, TRICK_PAUSE_MS } from './room';
import { RoomHarness } from './testing/harness';

/** A legal, simple choice for a human seat. */
function simpleAction(template: LegalAction): Action {
  switch (template.type) {
    case 'bid':
      return { type: 'bid', contract: template.choices.includes('pass') ? 'pass' : 'petite' };
    case 'callKing':
      return { type: 'callKing', card: template.cards[0] ?? 'S14' };
    case 'ecart':
      return { type: 'ecart', cards: template.eligible.slice(0, template.count) };
    case 'decideChelem':
      return { type: 'decideChelem', announce: false };
    case 'playCard':
      return { type: 'playCard', card: template.cards[0] ?? 'EXC' };
  }
}

/** Plays the connection's turn if it has one; returns whether it did. */
function playIfMyTurn(h: RoomHarness, connection: string): boolean {
  const template = h.view(connection).deal?.legalActions[0];
  if (!template) return false;
  h.send(connection, { type: 'action', action: simpleAction(template) });
  return true;
}

/** A table with the given humans (seats 0..) and Moyen bots on the other seats. */
function table(humans: string[], options: { players?: 3 | 4 | 5; deals?: number } = {}) {
  const h = new RoomHarness();
  humans.forEach((name, i) => h.join(`c${i}`, name));
  h.send('c0', { type: 'configure', options: { players: 4, ...options } });
  const players = options.players ?? 4;
  for (let seat = humans.length; seat < players; seat++) {
    h.send('c0', { type: 'setBot', seat, level: 'medium' });
  }
  return h;
}

/** Runs the room until `done`, humans playing simply and asking for each next deal. */
function runUntil(h: RoomHarness, connections: string[], done: () => boolean, maxSteps = 5000) {
  for (let step = 0; step < maxSteps && !done(); step++) {
    let acted = false;
    for (const c of connections) {
      acted = playIfMyTurn(h, c) || acted;
      const view = h.view(c);
      const seat = view.you.seat;
      if (view.session?.continued && seat !== null && !view.session.continued.includes(seat)) {
        h.send(c, { type: 'continue' });
        acted = true;
      }
    }
    if (!acted) h.advance(1000);
  }
}

describe('starting a session', () => {
  it('needs every seat filled, and the host', () => {
    const h = new RoomHarness();
    h.join('c0', 'Alice');
    h.join('c1', 'Bob');
    h.send('c1', { type: 'start' });
    expect(h.lastError('c1')).toBe('NOT_HOST');
    h.send('c0', { type: 'start' });
    expect(h.lastError('c0')).toBe('SEATS_NOT_FILLED');
  });

  it('deals the first deal and shows each player only their own hand', () => {
    const h = table(['Alice', 'Bob']);
    h.send('c0', { type: 'start' });
    const alice = h.view('c0');
    const bob = h.view('c1');
    expect(alice.phase).toBe('playing');
    expect(alice.deal?.hand).toHaveLength(18);
    expect(alice.session).toMatchObject({ deals: 8, played: 0, totals: [0, 0, 0, 0] });
    const aliceSees = JSON.stringify(alice);
    expect(bob.deal?.hand.some((card) => aliceSees.includes(`"${card}"`))).toBe(false);
  });
});

describe('actions', () => {
  it('answers an illegal action with an error to its sender only', () => {
    const h = table(['Alice', 'Bob']);
    h.send('c0', { type: 'start' });
    const idle = h.view('c0').deal?.turn === 0 ? 'c1' : 'c0';
    const other = idle === 'c0' ? 'c1' : 'c0';
    const before = h.messages(other).length;
    h.send(idle, { type: 'action', action: { type: 'bid', contract: 'pass' } });
    expect(h.lastError(idle)).toBe('NOT_YOUR_TURN');
    expect(h.messages(other)).toHaveLength(before);
  });

  it('refuses game actions in the lobby', () => {
    const h = table(['Alice']);
    h.send('c0', { type: 'action', action: { type: 'bid', contract: 'pass' } });
    expect(h.lastError('c0')).toBe('WRONG_ROOM_PHASE');
  });
});

describe('bots', () => {
  it('play their turn after the room delay, not before', () => {
    const h = table(['Alice']);
    h.send('c0', { type: 'start' });
    while (h.view('c0').deal?.turn === 0) playIfMyTurn(h, 'c0');
    const before = h.view('c0').deal;
    expect(h.wakeAt).toBe(h.now + BOT_DELAY_MS.normal);
    h.advance(BOT_DELAY_MS.normal - 1);
    expect(h.view('c0').deal).toEqual(before);
    h.advance(1);
    expect(h.view('c0').deal?.bids.length).toBe((before?.bids.length ?? 0) + 1);
  });

  it('wait a little longer after a completed trick', () => {
    const h = table(['Alice']);
    h.send('c0', { type: 'start' });
    let seenPause = false;
    runUntil(h, ['c0'], () => {
      const deal = h.view('c0').deal;
      const trickJustDone = deal?.currentTrick === null && (deal.lastTrick?.cards.length ?? 0) > 0;
      if (trickJustDone && deal.turn !== 0 && h.wakeAt !== null) {
        seenPause ||= h.wakeAt - h.now === TRICK_PAUSE_MS + BOT_DELAY_MS.normal;
      }
      return seenPause || (h.view('c0').session?.played ?? 0) >= 2;
    });
    expect(seenPause).toBe(true);
  });
});

describe('disconnection', () => {
  it('lets a bot play for a player gone for 10 s, until they come back', () => {
    const h = table(['Alice', 'Bob']);
    const bobToken = h.messages('c1').find((m) => m.type === 'welcome');
    h.send('c0', { type: 'start' });
    h.disconnect('c1');
    h.advance(REPLACE_AFTER_MS - 1);
    expect(h.view('c0').seats[1]).toMatchObject({ connected: false, replacedByBot: false });
    h.advance(1);
    expect(h.view('c0').seats[1]).toMatchObject({ connected: false, replacedByBot: true });

    // Bob's seat keeps being played while Alice plays hers.
    const bidsBefore = h.view('c0').deal?.bids.filter((b) => b.seat === 1).length ?? 0;
    runUntil(
      h,
      ['c0'],
      () =>
        (h.view('c0').deal?.bids.filter((b) => b.seat === 1).length ?? 0) > bidsBefore ||
        h.view('c0').deal?.phase !== 'bidding',
    );

    h.join('c9', 'Bob', bobToken?.type === 'welcome' ? bobToken.token : undefined);
    expect(h.view('c9').you.seat).toBe(1);
    expect(h.view('c0').seats[1]).toMatchObject({ connected: true, replacedByBot: false });
  });

  it('pauses the table when nobody is connected', () => {
    const h = table(['Alice']);
    h.send('c0', { type: 'start' });
    while (h.view('c0').deal?.turn === 0) playIfMyTurn(h, 'c0');
    h.disconnect('c0');
    const room = h.room;
    h.advance(60_000);
    expect(h.room.currentDeal).toEqual(room.currentDeal);
  });

  it('deletes a room left empty for 24 hours', () => {
    const h = table(['Alice']);
    h.disconnect('c0');
    h.advance(EXPIRE_AFTER_MS - 1);
    expect(h.destroyed).toBe(false);
    h.advance(1);
    expect(h.destroyed).toBe(true);
  });
});

describe('a whole session', () => {
  it('waits for every connected player before the next deal', () => {
    const h = table(['Alice', 'Bob']);
    h.send('c0', { type: 'start' });
    // Play the first deal through.
    for (let i = 0; i < 5000 && h.view('c0').session?.continued === null; i++) {
      if (!playIfMyTurn(h, 'c0') && !playIfMyTurn(h, 'c1')) h.advance(1000);
    }
    h.send('c0', { type: 'continue' });
    expect(h.view('c1').session?.continued).toEqual([0]);
    h.send('c1', { type: 'continue' });
    expect(h.view('c1').session?.continued).toBeNull();
    expect(h.view('c1').deal?.phase).toBe('bidding');
  });

  it('runs N played deals to a final score sheet, then can start again', () => {
    const h = table(['Alice'], { deals: 2 });
    h.send('c0', { type: 'start' });
    runUntil(h, ['c0'], () => h.view('c0').phase === 'finished');
    const final = h.view('c0');
    expect(final.phase).toBe('finished');
    expect(final.session?.played).toBe(2);
    expect(final.session?.totals.reduce((a, b) => a + b, 0)).toBe(0);
    expect(final.deal?.phase).toBe('finished');

    h.send('c0', { type: 'newSession' });
    expect(h.view('c0').phase).toBe('playing');
    expect(h.view('c0').session).toMatchObject({ played: 0, totals: [0, 0, 0, 0] });
  });

  it('goes back to the lobby after a session when the host asks', () => {
    const h = table(['Alice'], { deals: 1 });
    h.send('c0', { type: 'start' });
    runUntil(h, ['c0'], () => h.view('c0').phase === 'finished');
    h.send('c0', { type: 'backToLobby' });
    expect(h.view('c0')).toMatchObject({ phase: 'lobby', session: null, deal: null });
  });
});
