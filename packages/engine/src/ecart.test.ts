import { describe, expect, it } from 'vitest';
import { applyAction, createDealFromHands, getLegalActions, type Card } from './index';
import { simpleDeal, takeWith } from './testing/fixtures';

const CLUBS_WITHOUT_KING: Card[] = [
  'C01',
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
];

describe('écart', () => {
  // Seat 2 takes: clubs, T10–T13, plus the chien (T18–T21, Petit, Excuse).
  const deal = takeWith(simpleDeal(), 2, 'garde');

  it('offers the taker any card but kings, oudlers and (avoidable) trumps', () => {
    expect(getLegalActions(deal, 2)).toEqual([
      { type: 'ecart', count: 6, eligible: CLUBS_WITHOUT_KING, trumpsAllowed: false },
    ]);
    expect(getLegalActions(deal, 1)).toEqual([]);
  });

  it('sets the écart aside and moves to the chelem decision', () => {
    const ecart: Card[] = ['C01', 'C02', 'C03', 'C04', 'C05', 'C06'];
    const result = applyAction(deal, 2, { type: 'ecart', cards: ecart });
    if (!result.ok) throw new Error(result.error.code);
    expect(result.state).toMatchObject({ phase: 'chelemDecision', turn: 2, ecart });
    expect(result.state.hands[2]).toHaveLength(18);
    expect(result.state.hands[2]).not.toEqual(expect.arrayContaining(['C01']));
  });

  it.each<[string, Card[], string]>([
    ['a king', ['C14', 'C02', 'C03', 'C04', 'C05', 'C06'], 'ECART_FORBIDDEN_CARD'],
    ['an oudler', ['EXC', 'C02', 'C03', 'C04', 'C05', 'C06'], 'ECART_FORBIDDEN_CARD'],
    ['an avoidable trump', ['T18', 'C02', 'C03', 'C04', 'C05', 'C06'], 'ECART_TRUMP_AVOIDABLE'],
    ['too few cards', ['C01', 'C02', 'C03', 'C04', 'C05'], 'ECART_WRONG_COUNT'],
    ['a duplicated card', ['C01', 'C01', 'C03', 'C04', 'C05', 'C06'], 'ECART_WRONG_COUNT'],
    ['a card not in hand', ['H01', 'C02', 'C03', 'C04', 'C05', 'C06'], 'CARD_NOT_IN_HAND'],
  ])('rejects an écart with %s', (_, cards, code) => {
    expect(applyAction(deal, 2, { type: 'ecart', cards })).toEqual({ ok: false, error: { code } });
  });

  describe('when trumps are unavoidable', () => {
    // Seat 1 holds the 4 kings, the 3 oudlers and 11 trumps; the chien adds 3 trumps and 3 spades.
    const hands: Card[][] = [
      [
        'S04',
        'S05',
        'S06',
        'S07',
        'S08',
        'S09',
        'S10',
        'S11',
        'S12',
        'S13',
        'T16',
        'T17',
        'T18',
        'T19',
        'T20',
        'H01',
        'H02',
        'H03',
      ],
      [
        'S14',
        'H14',
        'D14',
        'C14',
        'T01',
        'T21',
        'EXC',
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
      ],
      [
        'H04',
        'H05',
        'H06',
        'H07',
        'H08',
        'H09',
        'H10',
        'H11',
        'H12',
        'H13',
        'D01',
        'D02',
        'D03',
        'D04',
        'D05',
        'D06',
        'D07',
        'D08',
      ],
      ['D09', 'D10', 'D11', 'D12', 'D13', ...CLUBS_WITHOUT_KING],
    ];
    const chien: Card[] = ['T13', 'T14', 'T15', 'S01', 'S02', 'S03'];
    const trumpDeal = takeWith(createDealFromHands({ hands, chien, dealer: 0 }), 1, 'petite');

    it('allows non-oudler trumps', () => {
      expect(getLegalActions(trumpDeal, 1)).toEqual([
        {
          type: 'ecart',
          count: 6,
          eligible: [
            'S01',
            'S02',
            'S03',
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
            'T14',
            'T15',
          ],
          trumpsAllowed: true,
        },
      ]);
      const result = applyAction(trumpDeal, 1, {
        type: 'ecart',
        cards: ['S01', 'S02', 'S03', 'T02', 'T03', 'T04'],
      });
      expect(result.ok).toBe(true);
    });

    it('still requires every other eligible card first', () => {
      const result = applyAction(trumpDeal, 1, {
        type: 'ecart',
        cards: ['S01', 'S02', 'T02', 'T03', 'T04', 'T05'],
      });
      expect(result).toEqual({ ok: false, error: { code: 'ECART_TRUMP_AVOIDABLE' } });
    });
  });
});

describe('chelem decision', () => {
  const deal = takeWith(simpleDeal(), 2, 'gardeSans');

  it('is offered to the taker only', () => {
    expect(getLegalActions(deal, 2)).toEqual([{ type: 'decideChelem' }]);
    expect(getLegalActions(deal, 1)).toEqual([]);
  });

  it('lets the taker lead the first trick after announcing', () => {
    const result = applyAction(deal, 2, { type: 'decideChelem', announce: true });
    expect(result).toMatchObject({
      ok: true,
      state: { phase: 'playing', turn: 2, chelemAnnounced: true },
    });
  });

  it('otherwise starts play with the seat after the dealer', () => {
    const result = applyAction(deal, 2, { type: 'decideChelem', announce: false });
    expect(result).toMatchObject({
      ok: true,
      state: { phase: 'playing', turn: 1, chelemAnnounced: false },
    });
  });
});
