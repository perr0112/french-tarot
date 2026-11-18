import {
  applyAction,
  createDeal,
  createRng,
  getPlayerView,
  type Card,
  type DealState,
} from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { createBot, emptyMemory, simulateDeal } from './index';
import { arrange, playOut, takeWith, turnView } from './testing/arrange';

const hard = createBot('hard');
const medium = createBot('medium');

describe('Difficile', () => {
  it.each([3, 4, 5] as const)(
    'plays whole deals with legal actions only (%i players)',
    (players) => {
      for (let seed = 0; seed < 2; seed++) {
        const bots = Array.from({ length: players }, (_, seat) => (seat === seed ? hard : medium));
        const end = simulateDeal({ players, dealer: 0, seed, bots });
        expect(['finished', 'cancelled']).toContain(end.phase);
      }
    },
    // Each Difficile decision plays out up to 200 deals; under coverage this takes seconds.
    60_000,
  );

  it('bids like Moyen', () => {
    const state = arrange({ players: 4, hands: {} });
    const view = turnView(state);
    expect(hard.decide(view, emptyMemory(), createRng(1)).action).toEqual(
      medium.decide(view, emptyMemory(), createRng(1)).action,
    );
  });

  it('plays its only card at once', () => {
    // Seat 1 must follow spades with its single spade.
    const hands: Record<number, Card[]> = {
      0: ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09'],
      1: ['S10'],
    };
    const deal = arrange({ players: 4, hands, voids: { 1: ['S'] } });
    const state = playOut(takeWith(deal, 0, { type: 'bid', contract: 'gardeSans' }), [
      [0, { type: 'decideChelem', announce: false }],
      [0, { type: 'playCard', card: 'S01' }],
    ]);
    expect(hard.decide(turnView(state), emptyMemory(), createRng(1)).action).toEqual({
      type: 'playCard',
      card: 'S10',
    });
  });

  it('plays like Moyen in 5 players while it does not know the partner', () => {
    let checked = 0;
    for (let seed = 1; seed <= 6; seed++) {
      let state: DealState = createDeal({ players: 5, dealer: 0, seed });
      while (state.turn !== null) {
        const seat = state.turn;
        const view = getPlayerView(state, seat);
        const moyen = medium.decide(view, emptyMemory(), createRng(seed));
        if (view.phase === 'playing' && view.calledCard !== null && view.knownPartner === null) {
          expect(hard.decide(view, emptyMemory(), createRng(seed)).action).toEqual(moyen.action);
          checked++;
        }
        const result = applyAction(state, seat, moyen.action);
        if (!result.ok) throw new Error(result.error.code);
        state = result.state;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});
