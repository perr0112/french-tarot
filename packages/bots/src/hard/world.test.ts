import {
  KING,
  applyAction,
  createDeal,
  createRng,
  getPlayerView,
  isOudler,
  isTrump,
  rankOf,
  type Card,
  type DealState,
  type PlayerCount,
  type PlayerView,
} from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { createBot } from '../index';
import { colourOf, emptyMemory, type BotMemory } from '../memory';
import { sampleWorld } from './world';

const medium = createBot('medium');
const sorted = (cards: readonly Card[]) => [...cards].sort();

/** Checks one sampled world against what the seat knows and the real deal. */
function checkWorld(real: DealState, view: PlayerView, memory: BotMemory, world: DealState) {
  const me = view.seat;
  expect(sorted(world.hands[me] ?? [])).toEqual(sorted(view.hand));
  world.hands.forEach((hand, seat) => expect(hand).toHaveLength(view.handSizes[seat] ?? -1));
  expect(world.tricks).toEqual(real.tricks);
  expect(world.currentTrick).toEqual(real.currentTrick);
  expect(world.turn).toBe(real.turn);
  // Nobody holds a colour they showed they lack.
  world.hands.forEach((hand, seat) => {
    const lacks = memory.voids[seat] ?? [];
    for (const card of hand) expect(lacks).not.toContain(colourOf(card));
  });
  // Shown poignée trumps not yet played stay with their owner.
  for (const p of view.poignees) {
    for (const card of p.cards.filter((c) => !memory.played.includes(c))) {
      expect(world.hands[p.seat]).toContain(card);
    }
  }
  if (typeof view.knownPartner === 'number') expect(world.partner).toBe(view.knownPartner);
  if (view.chien !== null) {
    expect(sorted(world.chien)).toEqual(sorted(view.chien));
    for (const card of view.shownEcartTrumps) expect(world.ecart).toContain(card);
    for (const card of world.ecart) {
      expect(isOudler(card) || rankOf(card) === KING).toBe(false);
      if (isTrump(card)) expect(view.shownEcartTrumps).toContain(card);
    }
  }
  if (view.ownEcart !== null) expect(sorted(world.ecart)).toEqual(sorted(view.ownEcart));
  if (view.ownEcart === null && view.chien === null)
    expect(world.chien).toHaveLength(real.chien.length);
}

/** Plays a Moyen-only deal and samples worlds at every turn in play. */
function sampleAlong(players: PlayerCount, seed: number): { samples: number; failed: number } {
  let state = createDeal({ players, dealer: seed % players, seed });
  const memories: BotMemory[] = Array.from({ length: players }, emptyMemory);
  const rng = createRng(seed);
  let samples = 0;
  let failed = 0;
  while (state.turn !== null) {
    const seat = state.turn;
    const view = getPlayerView(state, seat);
    const { action, memory } = medium.decide(view, memories[seat] ?? emptyMemory(), rng);
    if (state.phase === 'playing') {
      const world = sampleWorld(view, memory, rng);
      samples++;
      if (world === null) failed++;
      else checkWorld(state, view, memory, world);
    }
    memories[seat] = memory;
    const result = applyAction(state, seat, action);
    if (!result.ok) throw new Error(result.error.code);
    state = result.state;
  }
  return { samples, failed };
}

describe('sampleWorld', () => {
  it.each([3, 4, 5] as const)(
    'deals the unseen cards as the seat could imagine them (%i players)',
    (players) => {
      let samples = 0;
      let failed = 0;
      for (let seed = 1; seed <= 25; seed++) {
        const run = sampleAlong(players, seed);
        samples += run.samples;
        failed += run.failed;
      }
      expect(samples).toBeGreaterThan(300);
      expect(failed / samples).toBeLessThan(0.01);
    },
  );

  it('gives up without a complete trick history', () => {
    let state = createDeal({ players: 4, dealer: 0, seed: 7 });
    for (let i = 0; state.phase !== 'playing' || state.tricks.length < 2; i++) {
      const seat = state.turn ?? 0;
      const { action } = medium.decide(getPlayerView(state, seat), emptyMemory(), createRng(i));
      const result = applyAction(state, seat, action);
      if (!result.ok) throw new Error(result.error.code);
      state = result.state;
    }
    const seat = state.turn ?? 0;
    const view = getPlayerView(state, seat);
    const partial = medium.decide(view, emptyMemory(), createRng(1)).memory;
    expect(sampleWorld(view, partial, createRng(1))).toBeNull();
  });
});
