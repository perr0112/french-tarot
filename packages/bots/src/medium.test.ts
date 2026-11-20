import { createRng, isTrump, type Action, type Card } from '@tarot/engine';
import { fourKingsFifteenTrumps } from '@tarot/engine/testing';
import { describe, expect, it } from 'vitest';
import { createBot, emptyMemory } from './index';
import { arrange, playOut, takeWith, turnView } from './testing/arrange';

const medium = createBot('medium');
const decide = (state: Parameters<typeof turnView>[0]): Action =>
  medium.decide(turnView(state), emptyMemory(), createRng(1)).action;

// Worth 44 by the club method: 21 and a protected Petit, King, King-Queen, a singleton.
const PETITE_HAND: Card[] = [
  ...(['T21', 'T01', 'T05', 'T07', 'T09', 'T12', 'T15'] as const),
  ...(['S14', 'S02', 'S03', 'H14', 'H13', 'H04', 'D02', 'D03', 'D04', 'D05', 'C02'] as const),
];
// Worth 64: the three oudlers, five major trumps, King-Queen, a King, a void.
const GARDE_HAND: Card[] = [
  ...(['T21', 'T20', 'T19', 'T18', 'T17', 'T16', 'T01', 'T02', 'T03', 'T04', 'EXC'] as const),
  ...(['S14', 'S13', 'S02', 'H14', 'H02', 'H03', 'D02'] as const),
];
const WEAK_HAND: Card[] = [
  ...(['T02', 'T03', 'T04'] as const),
  ...(['S02', 'S03', 'S04', 'S05', 'H02', 'H03', 'H05', 'H06', 'D06', 'D07', 'D08'] as const),
  ...(['C03', 'C04', 'C05', 'C06'] as const),
];

describe('Moyen bidding', () => {
  it('passes with a weak hand', () => {
    expect(decide(arrange({ players: 4, hands: { 0: WEAK_HAND } }))).toEqual({
      type: 'bid',
      contract: 'pass',
    });
  });

  it('takes a Petite with an average taking hand', () => {
    expect(decide(arrange({ players: 4, hands: { 0: PETITE_HAND } }))).toEqual({
      type: 'bid',
      contract: 'petite',
    });
  });

  it('takes a Garde with a strong hand', () => {
    expect(decide(arrange({ players: 4, hands: { 0: GARDE_HAND } }))).toEqual({
      type: 'bid',
      contract: 'garde',
    });
  });

  it('does not overbid a Garde with a Petite hand', () => {
    // Worth 48: eleven trumps, two King-Queens, a long suit, two cuts.
    const petiteHand: Card[] = [
      ...(['T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15'] as const),
      ...(['D14', 'D13', 'C14', 'C13', 'C12', 'C11', 'C10'] as const),
    ];
    const deal = arrange({ players: 4, hands: { 0: GARDE_HAND, 1: petiteHand } });
    expect(decide(playOut(deal, [[0, { type: 'bid', contract: 'pass' }]]))).toEqual({
      type: 'bid',
      contract: 'petite',
    });
    const afterGarde = playOut(deal, [[0, { type: 'bid', contract: 'garde' }]]);
    expect(decide(afterGarde)).toEqual({ type: 'bid', contract: 'pass' });
  });
});

describe('Moyen king call (5 players)', () => {
  it('calls the King of the suit where it holds the Dame and Cavalier', () => {
    const hand: Card[] = [
      ...(['T21', 'T01', 'T10', 'T11', 'T12', 'T13', 'EXC'] as const),
      ...(['S13', 'S12', 'C02', 'C03', 'C04', 'C05', 'C06', 'D02'] as const),
    ];
    const deal = takeWith(arrange({ players: 5, hands: { 0: hand } }), 0, {
      type: 'bid',
      contract: 'garde',
    });
    expect(decide(deal)).toEqual({ type: 'callKing', card: 'S14' });
  });
});

describe('Moyen écart', () => {
  it('cuts its short suits without a King, saving their court cards', () => {
    const hand: Card[] = [
      ...(['T21', 'T01', 'T05', 'T07', 'T09', 'T12', 'T15'] as const),
      ...(['S14', 'S02', 'S03', 'S04', 'H14', 'H13', 'H04', 'H05'] as const),
      ...(['C02', 'C05', 'C13'] as const),
    ];
    const chien: Card[] = ['D02', 'D03', 'S05', 'S06', 'H06', 'T16'];
    const deal = takeWith(arrange({ players: 4, hands: { 0: hand }, chien }), 0, {
      type: 'bid',
      contract: 'petite',
    });
    const action = decide(deal);
    expect(action.type).toBe('ecart');
    if (action.type !== 'ecart') return;
    expect(action.cards).toEqual(expect.arrayContaining(['C02', 'C05', 'C13', 'D02', 'D03']));
    expect(action.cards).toHaveLength(6);
  });

  it('keeps the called suit in 5 players', () => {
    const hand: Card[] = [
      ...(['T21', 'T01', 'T10', 'T11', 'T12', 'T13', 'EXC'] as const),
      ...(['S13', 'S12', 'S05', 'H02', 'C02', 'C03', 'C04', 'C14'] as const),
    ];
    const chien: Card[] = ['D02', 'D03', 'C05'];
    const deal = playOut(
      takeWith(arrange({ players: 5, hands: { 0: hand }, chien }), 0, {
        type: 'bid',
        contract: 'garde',
      }),
      [[0, { type: 'callKing', card: 'H14' }]],
    );
    const action = decide(deal);
    expect(action.type).toBe('ecart');
    if (action.type !== 'ecart') return;
    expect(action.cards).not.toContain('H02');
    expect(action.cards).toEqual(expect.arrayContaining(['D02', 'D03']));
  });
});

describe('Moyen declarations', () => {
  it('never announces a chelem', () => {
    const deal = takeWith(arrange({ players: 4, hands: { 0: GARDE_HAND } }), 0, {
      type: 'bid',
      contract: 'gardeSans',
    });
    expect(decide(deal)).toEqual({ type: 'decideChelem', announce: false });
  });

  it('shows a poignée of its weakest trumps with its first card', () => {
    const deal = takeWith(arrange({ players: 4, hands: { 0: GARDE_HAND } }), 0, {
      type: 'bid',
      contract: 'gardeSans',
    });
    const playing = playOut(deal, [[0, { type: 'decideChelem', announce: false }]]);
    const action = decide(playing);
    expect(action).toMatchObject({
      type: 'playCard',
      poignee: ['T01', 'T02', 'T03', 'T04', 'T16', 'T17', 'T18', 'T19', 'T20', 'T21'],
    });
  });

  it('shows again the trump its écart forced out, for a triple poignée (FFT p. 6)', () => {
    const { hands, chien } = fourKingsFifteenTrumps();
    const deal = takeWith(arrange({ players: 4, hands: { 0: hands[0] ?? [] }, chien }), 0, {
      type: 'bid',
      contract: 'garde',
    });
    let state = playOut(deal, [[0, decide(deal)]]);
    expect(state.ecart.filter(isTrump)).toHaveLength(1);
    if (state.phase === 'chelemDecision') state = playOut(state, [[0, decide(state)]]);
    const action = decide(state);
    expect(action.type === 'playCard' && action.poignee).toHaveLength(15);
  });
});
