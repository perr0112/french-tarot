import type { BotMemory } from '@tarot/bots';
import type { Action, LegalAction, PlayerView } from '@tarot/engine';
import { describe, expect, it, vi } from 'vitest';
import { REPLACE_AFTER_MS } from './room';
import { RoomHarness } from './testing/harness';

/** What each bot decision at seat 1 ended up remembering, with the view it decided on. */
const seen = vi.hoisted(() => [] as { view: PlayerView; memory: BotMemory }[]);

vi.mock('@tarot/bots', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tarot/bots')>();
  return {
    ...actual,
    createBot: (level: Parameters<typeof actual.createBot>[0]) => {
      const bot = actual.createBot(level);
      return {
        level,
        decide: (view: PlayerView, memory: BotMemory, rng: () => number) => {
          const decision = bot.decide(view, memory, rng);
          if (view.seat === 1) seen.push({ view, memory: decision.memory });
          return decision;
        },
      };
    },
  };
});

const simple = (template: LegalAction): Action => {
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
};

describe('a bot standing in for a player mid-deal', () => {
  it('knows every trick played before it took over', () => {
    const h = new RoomHarness();
    h.join('c0', 'Alice');
    h.join('c1', 'Bob');
    [2, 3].forEach((seat) => h.send('c0', { type: 'setBot', seat, level: 'medium' }));
    h.send('c0', { type: 'start' });
    // Alice and Bob play until three tricks are done; a deal nobody takes is dealt again.
    for (
      let step = 0;
      step < 2000 &&
      (h.view('c0').deal?.lastTrick === null ||
        (h.view('c0').deal?.tricksWon.reduce((a, b) => a + b, 0) ?? 0) < 3);
      step++
    ) {
      let acted = false;
      for (const c of ['c0', 'c1']) {
        const template = h.view(c).deal?.legalActions[0];
        if (template) {
          h.send(c, { type: 'action', action: simple(template) });
          acted = true;
        }
        const view = h.view(c);
        if (
          view.session?.continued &&
          view.you.seat !== null &&
          !view.session.continued.includes(view.you.seat)
        ) {
          h.send(c, { type: 'continue' });
          acted = true;
        }
      }
      if (!acted) h.advance(1000);
    }
    expect(h.view('c0').deal?.phase).toBe('playing');

    seen.length = 0;
    h.disconnect('c1');
    h.advance(REPLACE_AFTER_MS);
    for (let step = 0; step < 50 && seen.length === 0; step++) {
      const template = h.view('c0').deal?.legalActions[0];
      if (template) h.send('c0', { type: 'action', action: simple(template) });
      else h.advance(1000);
    }
    const [first] = seen;
    expect(first).toBeDefined();
    const completed = first?.view.tricksWon.reduce((a, b) => a + b, 0) ?? 0;
    expect(completed).toBeGreaterThanOrEqual(3);
    expect(first?.memory.tricks).toHaveLength(completed);
    expect(first?.memory.tricks.map((t) => t.cards)).toEqual(
      h.room.currentDeal?.tricks.slice(0, completed).map((t) => t.cards),
    );
  });

  it('rebuilds a memory saved before tricks were remembered', () => {
    const h = new RoomHarness();
    h.join('c0', 'Alice');
    [1, 2, 3].forEach((seat) => h.send('c0', { type: 'setBot', seat, level: 'medium' }));
    h.send('c0', { type: 'start' });
    for (let step = 0; step < 2000 && (h.room.currentDeal?.tricks.length ?? 0) < 2; step++) {
      const template = h.view('c0').deal?.legalActions[0];
      if (template) h.send('c0', { type: 'action', action: simple(template) });
      else h.advance(1000);
    }
    // Rooms stored by the previous version kept memories without their tricks.
    const old = { played: [], voids: [] } as unknown as BotMemory;
    h.room = { ...h.room, memories: h.room.memories.map(() => old) };
    seen.length = 0;
    for (let step = 0; step < 50 && seen.length === 0; step++) {
      const template = h.view('c0').deal?.legalActions[0];
      if (template) h.send('c0', { type: 'action', action: simple(template) });
      else h.advance(1000);
    }
    const [first] = seen;
    const completed = first?.view.tricksWon.reduce((a, b) => a + b, 0) ?? 0;
    expect(first?.memory.tricks).toHaveLength(completed);
  });
});
