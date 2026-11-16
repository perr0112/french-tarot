import {
  ALL_CARDS,
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
const decide = (state: DealState): Action =>
  medium.decide(turnView(state), emptyMemory(), createRng(1)).action;

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

  it('does not load a King its partner leads while the taker may still trump', () => {
    // Seat 1 holds every trump above the King's rank, yet the taker can trump with any other.
    const hand: Card[] = [
      ...(['T15', 'T16', 'T17', 'T18', 'T19', 'T20', 'T21', 'S13', 'S03'] as const),
      ...(['H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08', 'H09', 'H10'] as const),
    ];
    const state = playOut(inPlay(3, { 0: ['S14'], 1: hand }), [[0, play('S14')]]);
    expect(decide(state)).toEqual(play('S03'));
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
  it('leads, in defence, the suit the taker showed it lacks', () => {
    const defender: Card[] = [
      ...(['H14', 'H05', 'H06', 'H07', 'H08', 'S02'] as const),
      ...([
        'C02',
        'C03',
        'C04',
        'C05',
        'C06',
        'C07',
        'C08',
        'C09',
        'C10',
        'C11',
        'C12',
        'C13',
      ] as const),
    ];
    const taker: Card[] = [
      ...(['S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10', 'S11', 'S12', 'S13'] as const),
      ...(['D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08'] as const),
    ];
    const state = playOut(inPlay(3, { 0: ['H02'], 1: defender, 2: ['H03'], 3: taker }), [
      [0, play('H02')],
      [1, play('H14')],
      [2, play('H03')],
      [3, play('D02')],
    ]);
    expect(decide(state)).toEqual(play('H05'));
  });

  it('forgets a previous deal, even when its first decision comes during play', () => {
    const state = playOut(inPlay(0, { 0: ['S02', ...TRUMPS_LOW] }), [[0, play('S02')]]);
    const previous = medium.decide(turnView(state), emptyMemory(), createRng(1)).memory;
    const stale = { ...previous, played: [...ALL_CARDS.slice(20, 60)] };
    expect(medium.decide(turnView(state), stale, createRng(1)).memory).toEqual(previous);
  });

  it('starts afresh with a new deal', () => {
    const bidding = arrange({ players: 4, hands: {} });
    const stale = { played: ['S02' as Card], voids: [['S' as const]] };
    expect(medium.decide(turnView(bidding), stale, createRng(1)).memory).toEqual(emptyMemory());
  });
});
