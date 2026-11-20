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
import { fourKingsFifteenTrumps } from '@tarot/engine/testing';
import { describe, expect, it } from 'vitest';
import { createBot } from '../index';
import { colourOf, emptyMemory, type BotMemory } from '../memory';
import { sampleDeal } from './sample-deal';

const medium = createBot('medium');
const sorted = (cards: readonly Card[]) => [...cards].sort();

/** Checks one sampled deal against what the seat knows and the real deal. */
function checkSample(real: DealState, view: PlayerView, memory: BotMemory, sample: DealState) {
  const me = view.seat;
  expect(sorted(sample.hands[me] ?? [])).toEqual(sorted(view.hand));
  sample.hands.forEach((hand, seat) => expect(hand).toHaveLength(view.handSizes[seat] ?? -1));
  expect(sample.tricks).toEqual(real.tricks);
  expect(sample.currentTrick).toEqual(real.currentTrick);
  expect(sample.turn).toBe(real.turn);
  // Nobody holds a colour they showed they lack.
  sample.hands.forEach((hand, seat) => {
    const lacks = memory.voids[seat] ?? [];
    for (const card of hand) expect(lacks).not.toContain(colourOf(card));
  });
  // Shown poignée trumps not yet played stay with their owner, but for the taker's écart trumps.
  for (const p of view.poignees) {
    const inHand = p.cards.filter(
      (c) =>
        !memory.played.includes(c) && !(p.seat === view.taker && view.shownEcartTrumps.includes(c)),
    );
    for (const card of inHand) {
      expect(sample.hands[p.seat]).toContain(card);
    }
  }
  if (typeof view.knownPartner === 'number') expect(sample.partner).toBe(view.knownPartner);
  if (view.chien !== null) {
    expect(sorted(sample.chien)).toEqual(sorted(view.chien));
    for (const card of view.shownEcartTrumps) expect(sample.ecart).toContain(card);
    for (const card of sample.ecart) {
      expect(isOudler(card) || rankOf(card) === KING).toBe(false);
      if (isTrump(card)) expect(view.shownEcartTrumps).toContain(card);
    }
  }
  if (view.ownEcart !== null) expect(sorted(sample.ecart)).toEqual(sorted(view.ownEcart));
  if (view.ownEcart === null && view.chien === null)
    expect(sample.chien).toHaveLength(real.chien.length);
}

/** Plays a Moyen-only deal and samples deals at every turn in play. */
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
      const sample = sampleDeal(view, memory, rng);
      samples++;
      if (sample === null) failed++;
      else checkSample(state, view, memory, sample);
    }
    memories[seat] = memory;
    const result = applyAction(state, seat, action);
    if (!result.ok) throw new Error(result.error.code);
    state = result.state;
  }
  return { samples, failed };
}

describe('sampleDeal', () => {
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
    expect(sampleDeal(view, partial, createRng(1))).toBeNull();
  });

  it('leaves in the écart the discarded trumps the taker showed again in a poignée', () => {
    const fft = fourKingsFifteenTrumps();
    const shown = applyAction(fft.deal, 0, { type: 'playCard', card: 'S14', poignee: fft.fifteen });
    if (!shown.ok) throw new Error(shown.error.code);
    const state = shown.state;
    const view = getPlayerView(state, 1);
    const { memory } = medium.decide(view, emptyMemory(), createRng(1));
    const sample = sampleDeal(view, memory, createRng(1));
    expect(sample).not.toBeNull();
    if (sample) {
      checkSample(state, view, memory, sample);
      expect(sample.hands[0]).not.toContain(fft.ecartTrump);
    }
  });
});
