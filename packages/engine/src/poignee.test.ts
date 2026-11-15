import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createDealFromHands,
  getLegalActions,
  type Card,
  type DealState,
} from './index';
import { card, play, takeWith } from './testing/fixtures';

const TRUMPS_2_TO_13: Card[] = [
  'T02',
  'T03',
  'T04',
  'T05',
  'T06',
  'T07',
  'T08',
  'T09',
  'T10',
  'T11',
  'T12',
  'T13',
];

// Seat 0 holds 12 trumps and the Excuse; dealer 3, so seat 0 leads; garde sans by seat 3.
const hands: Card[][] = [
  [...TRUMPS_2_TO_13, 'EXC', 'S01', 'S02', 'S03', 'S04', 'S05'],
  [
    'T14',
    'T15',
    'T16',
    'T17',
    'T18',
    'T19',
    'T20',
    'T21',
    'H01',
    'H02',
    'H03',
    'H04',
    'H05',
    'H06',
    'H07',
    'H08',
    'H09',
    'H10',
  ],
  [
    'S06',
    'S07',
    'S08',
    'S09',
    'S10',
    'S11',
    'S12',
    'S13',
    'S14',
    'H11',
    'H12',
    'H13',
    'H14',
    'D01',
    'D02',
    'D03',
    'D04',
    'D05',
  ],
  [
    'D06',
    'D07',
    'D08',
    'D09',
    'D10',
    'D11',
    'D12',
    'D13',
    'D14',
    'C01',
    'C02',
    'C03',
    'C04',
    'C05',
    'C06',
    'C07',
    'C08',
    'C09',
  ],
];
const chien: Card[] = ['C10', 'C11', 'C12', 'C13', 'C14', 'T01'];
const start: DealState = takeWith(
  createDealFromHands({ hands, chien, dealer: 3, options: { chelemAnnouncements: false } }),
  3,
  'gardeSans',
);

const playCardTemplate = (state: DealState, seat: number) =>
  getLegalActions(state, seat).find((a) => a.type === 'playCard');

describe('poignée', () => {
  it('is offered with the first card, up to the levels the trumps (and Excuse) allow', () => {
    expect(playCardTemplate(start, 0)).toMatchObject({
      poignee: {
        eligible: ['EXC', ...TRUMPS_2_TO_13],
        levels: [
          { level: 'simple', size: 10 },
          { level: 'double', size: 13 },
        ],
      },
    });
  });

  it('is not offered to a seat without enough trumps', () => {
    const state = play(start, [[0, card('S01')]]);
    expect(playCardTemplate(state, 1)).toMatchObject({ poignee: null });
  });

  it('is recorded when shown with exactly a threshold number of trumps', () => {
    const shown = TRUMPS_2_TO_13.slice(0, 10);
    const result = applyAction(start, 0, { type: 'playCard', card: 'S01', poignee: shown });
    expect(result).toMatchObject({
      ok: true,
      state: { poignees: [{ seat: 0, level: 'simple', cards: shown }] },
    });
  });

  it('accepts the Excuse only when no other trump could take its place', () => {
    const withExcuse: Card[] = [...TRUMPS_2_TO_13, 'EXC'];
    expect(
      applyAction(start, 0, { type: 'playCard', card: 'S01', poignee: withExcuse }),
    ).toMatchObject({
      ok: true,
      state: { poignees: [{ seat: 0, level: 'double' }] },
    });
    const simpleWithExcuse: Card[] = [...TRUMPS_2_TO_13.slice(0, 9), 'EXC'];
    expect(
      applyAction(start, 0, { type: 'playCard', card: 'S01', poignee: simpleWithExcuse }),
    ).toEqual({
      ok: false,
      error: { code: 'POIGNEE_INVALID' },
    });
  });

  it.each<[string, Card[]]>([
    ['a size that is not a threshold', TRUMPS_2_TO_13.slice(0, 11)],
    ['a card that is not a trump', [...TRUMPS_2_TO_13.slice(0, 9), 'S02']],
    ['a duplicated trump', [...TRUMPS_2_TO_13.slice(0, 9), 'T02']],
  ])('is rejected with %s', (_, poignee) => {
    expect(applyAction(start, 0, { type: 'playCard', card: 'S01', poignee })).toEqual({
      ok: false,
      error: { code: 'POIGNEE_INVALID' },
    });
  });

  it('cannot be shown after the first card', () => {
    // Seat 1 trumps the first trick and leads hearts; seat 0 has no heart and must trump.
    const state = play(start, [
      [0, card('S01')],
      [1, card('T14')],
      [2, card('S06')],
      [3, card('D06')],
      [1, card('H01')],
      [2, card('H11')],
      [3, card('D07')],
    ]);
    expect(playCardTemplate(state, 0)).toMatchObject({ poignee: null });
    expect(
      applyAction(state, 0, {
        type: 'playCard',
        card: 'T02',
        poignee: TRUMPS_2_TO_13.slice(0, 10),
      }),
    ).toEqual({ ok: false, error: { code: 'POIGNEE_NOT_FIRST_CARD' } });
  });
});
