import {
  createRng,
  isTrump,
  type Action,
  type Card,
  type DealState,
  type Suit,
} from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { createBot, emptyMemory } from './index';
import { arrange, playOut, takeWith, turnView } from './testing/arrange';

const medium = createBot('medium');
const decideFull = (state: DealState) =>
  medium.decide(turnView(state), emptyMemory(), createRng(1));
const decide = (state: DealState): Action => decideFull(state).action;

const play = (card: Card): Action => ({ type: 'playCard', card });

/** A 4-player Garde sans by `taker` with fixed hands, ready for the first lead (seat 0). */
function inPlay(
  taker: number,
  hands: Record<number, Card[]>,
  voids: Record<number, Suit[]> = {},
): DealState {
  const deal = takeWith(arrange({ players: 4, hands, voids }), taker, {
    type: 'bid',
    contract: 'gardeSans',
  });
  return playOut(deal, [[taker, { type: 'decideChelem', announce: false }]]);
}

const TRUMPS_LOW: Card[] = ['T02', 'T03', 'T04', 'T06'];

describe('Moyen card play', () => {
  it('loads a trick its partner surely wins with its most valuable card', () => {
    const state = playOut(
      inPlay(0, {
        0: ['S02', 'S04', ...TRUMPS_LOW],
        1: ['S14', 'S05'],
        2: ['S13', 'S03', 'H02'],
      }),
      [
        [0, play('S02')],
        [1, play('S14')],
      ],
    );
    expect(decide(state)).toEqual(play('S13'));
  });

  it('gives its cheapest card when the opponent wins and it cannot', () => {
    const defender: Card[] = [
      ...(['S13', 'S03', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08', 'H09'] as const),
      ...(['H10', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08'] as const),
    ];
    const state = playOut(inPlay(0, { 0: ['S14', ...TRUMPS_LOW], 1: defender }), [
      [0, play('S14')],
    ]);
    expect(decide(state)).toEqual(play('S03'));
  });

  it('takes a valuable trick with its smallest winning card', () => {
    const state = playOut(inPlay(0, { 0: ['S12', ...TRUMPS_LOW], 1: ['S14', 'S13', 'S03'] }), [
      [0, play('S12')],
    ]);
    expect(decide(state)).toEqual(play('S13'));
  });

  it('saves its Petit when only partners play after it', () => {
    const state = playOut(
      inPlay(
        0,
        { 0: ['S14', ...TRUMPS_LOW], 1: ['T01', 'T05', 'T10', 'H02', 'H03'] },
        { 1: ['S'] },
      ),
      [[0, play('S14')]],
    );
    expect(decide(state)).toEqual(play('T01'));
  });

  it('keeps its Petit when the taker still plays after it', () => {
    const state = playOut(
      inPlay(
        2,
        { 0: ['S02', 'S03'], 1: ['T01', 'T05', 'T10', 'H02', 'H03'], 2: TRUMPS_LOW },
        { 1: ['S'] },
      ),
      [[0, play('S02')]],
    );
    expect(decide(state)).not.toEqual(play('T01'));
  });

  it('leads trumps as a taker holding many of them', () => {
    const trumps: Card[] = ['T21', 'T20', 'T19', 'T18', 'T17', 'T16', 'T15', 'T14', 'T13', 'T12'];
    const action = decide(inPlay(0, { 0: [...trumps, 'S02', 'S03'] }));
    expect(action.type === 'playCard' && isTrump(action.card)).toBe(true);
  });

  it('does not lead trumps in defence', () => {
    const state = inPlay(2, { 0: ['T05', 'T06', 'T07', 'T08', 'S02', 'S03', 'H07'] });
    const action = decide(state);
    expect(action.type === 'playCard' && !isTrump(action.card)).toBe(true);
  });
});

describe('Moyen memory', () => {
  it('remembers played cards and who failed to follow', () => {
    const state = playOut(
      inPlay(0, { 0: ['S02', ...TRUMPS_LOW], 1: ['T05', 'H02', 'H03'], 2: ['S05'] }, { 1: ['S'] }),
      [
        [0, play('S02')],
        [1, play('T05')],
      ],
    );
    const { memory } = decideFull(state);
    expect(memory.played).toEqual(['S02', 'T05']);
    expect(memory.voids[1]).toEqual(['S']);
    expect(memory.voids[0]).toEqual([]);
  });

  it('starts afresh with a new deal', () => {
    const bidding = arrange({ players: 4, hands: {} });
    const stale = { played: ['S02' as Card], voids: [['S' as const]] };
    expect(medium.decide(turnView(bidding), stale, createRng(1)).memory).toEqual(emptyMemory());
  });
});
