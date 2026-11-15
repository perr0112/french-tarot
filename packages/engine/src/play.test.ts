import { describe, expect, it } from 'vitest';
import { applyAction, getLegalActions, type Card, type DealState, type Seat } from './index';
import { MIXED_HANDS, card, mixedDealInPlay, play, simpleDeal, takeWith } from './testing/fixtures';

const playable = (state: DealState, seat: Seat): Card[] => {
  const legal = getLegalActions(state, seat).find((a) => a.type === 'playCard');
  return legal && legal.type === 'playCard' ? [...legal.cards].sort() : [];
};
const sorted = (cards: readonly Card[]) => [...cards].sort();

describe('trick play', () => {
  // Dealer 2, so seat 3 leads the first trick.
  const start = mixedDealInPlay(2);

  it('lets the leader play any card', () => {
    expect(start).toMatchObject({ phase: 'playing', turn: 3 });
    expect(playable(start, 3)).toEqual(sorted(MIXED_HANDS[3] ?? []));
  });

  it('forces a seat void in the led suit to trump', () => {
    const state = play(start, [[3, card('C01')]]);
    expect(playable(state, 0)).toEqual(['T02', 'T03', 'T04', 'T05', 'T10', 'T11', 'T12', 'T13']);
  });

  it('forces an over-trump when possible', () => {
    const state = play(start, [
      [3, card('C01')],
      [0, card('T10')],
    ]);
    expect(playable(state, 1)).toEqual(['T14', 'T15', 'T16', 'T17']);
  });

  it('lets a seat with neither the suit nor a trump play anything', () => {
    const state = play(start, [
      [3, card('C01')],
      [0, card('T10')],
      [1, card('T14')],
    ]);
    expect(playable(state, 2)).toEqual(sorted(MIXED_HANDS[2] ?? []));
  });

  it('gives the trick to the highest trump, who leads the next one', () => {
    const state = play(start, [
      [3, card('C01')],
      [0, card('T10')],
      [1, card('T14')],
      [2, card('S11')],
    ]);
    expect(state.turn).toBe(1);
    expect(state.tricks).toEqual([
      {
        leader: 3,
        cards: [
          { seat: 3, card: 'C01' },
          { seat: 0, card: 'T10' },
          { seat: 1, card: 'T14' },
          { seat: 2, card: 'S11' },
        ],
        winner: 1,
      },
    ]);
  });

  describe('after seat 1 wins the first trick', () => {
    const second = play(start, [
      [3, card('C01')],
      [0, card('T10')],
      [1, card('T14')],
      [2, card('S11')],
    ]);

    it('requires a higher trump when trump is led', () => {
      const state = play(second, [
        [1, card('T06')],
        [2, card('D01')],
        [3, card('C02')],
      ]);
      expect(playable(state, 0)).toEqual(['T11', 'T12', 'T13']);
    });

    it('requires following suit, the Excuse always being allowed', () => {
      const state = play(second, [[1, card('S06')]]);
      expect(playable(state, 2)).toEqual(['EXC', 'S12', 'S13', 'S14']);
    });

    it('gives the trick to the highest card of the led suit when nobody trumps', () => {
      const state = play(second, [
        [1, card('S06')],
        [2, card('S14')],
        [3, card('C02')],
        [0, card('S01')],
      ]);
      expect(state.turn).toBe(2);
    });

    it('never gives the trick to the Excuse', () => {
      const state = play(second, [
        [1, card('S06')],
        [2, card('EXC')],
        [3, card('C02')],
        [0, card('S01')],
      ]);
      expect(state.turn).toBe(1);
    });
  });

  describe('when the Excuse is led', () => {
    // Dealer 1, so seat 2 (holding the Excuse) leads.
    const start2 = mixedDealInPlay(1);

    it('lets the next card set the suit to follow', () => {
      const afterExcuse = play(start2, [[2, card('EXC')]]);
      expect(playable(afterExcuse, 3)).toEqual(sorted(MIXED_HANDS[3] ?? []));
      const afterClub = play(afterExcuse, [[3, card('C05')]]);
      expect(playable(afterClub, 0)).toEqual([
        'T02',
        'T03',
        'T04',
        'T05',
        'T10',
        'T11',
        'T12',
        'T13',
      ]);
    });
  });

  it('rejects a card the seat does not hold, or may not play', () => {
    expect(applyAction(start, 3, card('H01'))).toEqual({
      ok: false,
      error: { code: 'CARD_NOT_IN_HAND' },
    });
    const state = play(start, [[3, card('C01')]]);
    expect(applyAction(state, 0, card('S01'))).toEqual({
      ok: false,
      error: { code: 'CARD_NOT_PLAYABLE' },
    });
  });

  it('pisses a lower trump when it cannot over-trump', () => {
    // Simple hands, garde sans by seat 2, seat 1 leads hearts.
    const deal = takeWith(simpleDeal(0, { chelemAnnouncements: false }), 2, 'gardeSans');
    const state = play(deal, [
      [1, card('H01')],
      [2, card('T13')],
      [3, card('T17')],
    ]);
    expect(playable(state, 0)).toEqual(['T02', 'T03', 'T04', 'T05']);
  });

  it('finishes the deal after the last trick', () => {
    let state = start;
    while (state.phase === 'playing') {
      const seat = state.turn as Seat;
      const [first] = playable(state, seat);
      state = play(state, [[seat, card(first as Card)]]);
    }
    expect(state.phase).toBe('finished');
    expect(state.tricks).toHaveLength(18);
    expect(state.hands.every((hand) => hand.length === 0)).toBe(true);
  });
});
