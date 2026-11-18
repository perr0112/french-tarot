import { describe, expect, it } from 'vitest';
import {
  ALL_CARDS,
  applyAction,
  createDealFromHands,
  getLegalActions,
  getPlayerView,
  type Card,
} from './index';
import {
  FIVE_CHIEN,
  FIVE_HANDS,
  callKing,
  card,
  fiveDeal,
  play,
  simpleDeal,
  swapCards,
  takeWith,
} from './testing/fixtures';
import { playRandomly } from './testing/random-player';

describe('king call (5 players)', () => {
  it('has the taker call a King right after the bidding', () => {
    const deal = takeWith(fiveDeal(), 0, 'garde');
    expect(deal).toMatchObject({ phase: 'kingCall', turn: 0, taker: 0, contract: 'garde' });
    expect(getLegalActions(deal, 0)).toEqual([
      { type: 'callKing', cards: ['C14', 'D14', 'H14', 'S14'] },
    ]);
  });

  it('keeps the chien hidden until the King is called (AGENTS.md §3.5)', () => {
    const deal = takeWith(fiveDeal(), 0, 'garde');
    for (const seat of [0, 1, 2, 3, 4]) expect(getPlayerView(deal, seat).chien).toBeNull();
    const called = play(deal, [[0, callKing('H14')]]);
    expect(getPlayerView(called, 1).chien).toEqual(FIVE_CHIEN);
  });

  it('makes the holder of the called King the partner, then goes on to the écart', () => {
    const deal = play(takeWith(fiveDeal(), 0, 'garde'), [[0, callKing('H14')]]);
    expect(deal).toMatchObject({ calledCard: 'H14', partner: 4, phase: 'ecart', turn: 0 });
    expect(deal.hands[0]).toHaveLength(18);
  });

  it('leaves the taker alone when the called King is in their hand or in the chien', () => {
    const own = play(takeWith(fiveDeal(), 4, 'garde'), [[4, callKing('S14')]]);
    expect(own).toMatchObject({ calledCard: 'S14', partner: null });
    const inChien = play(takeWith(fiveDeal(), 0, 'gardeSans'), [[0, callKing('C14')]]);
    expect(inChien).toMatchObject({ partner: null, phase: 'chelemDecision', turn: 0 });
  });

  it('has a taker holding the four Kings call a Dame', () => {
    const { hands, chien } = swapCards(FIVE_HANDS, FIVE_CHIEN, 'C13', 'C14');
    const deal = takeWith(createDealFromHands({ hands, chien, dealer: 0 }), 4, 'petite');
    expect(getLegalActions(deal, 4)).toEqual([
      { type: 'callKing', cards: ['C13', 'D13', 'H13', 'S13'] },
    ]);
    expect(applyAction(deal, 4, callKing('S14'))).toEqual({
      ok: false,
      error: { code: 'KING_CALL_INVALID' },
    });
    expect(play(deal, [[4, callKing('C13')]])).toMatchObject({ partner: null });
  });

  it('refuses a king call outside its phase', () => {
    expect(applyAction(fiveDeal(), 1, callKing('S14'))).toEqual({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });
  });

  it('does not exist in 4 players', () => {
    expect(takeWith(simpleDeal(), 1, 'garde')).toMatchObject({ phase: 'ecart', partner: null });
  });
});

const noChelem = { type: 'decideChelem', announce: false } as const;

describe('first lead (5 players)', () => {
  it('may not be in the called suit, unless it is the called King', () => {
    // Dealer 4: seat 0 (spades and trumps) leads; the King of spades is called.
    const deal = play(takeWith(fiveDeal(4), 1, 'gardeSans'), [
      [1, callKing('S14')],
      [1, noChelem],
    ]);
    expect(getLegalActions(deal, 0)).toEqual([
      { type: 'playCard', cards: ['T02', 'T03', 'T04', 'T05', 'T06'], poignee: null },
    ]);
  });

  it('binds only the leader: after an Excuse lead, the next card may be in the called suit', () => {
    // Dealer 2: seat 3 leads the Excuse; seat 4 then sets the suit, diamonds included.
    const deal = play(takeWith(fiveDeal(2), 1, 'gardeSans'), [
      [1, callKing('D14')],
      [1, noChelem],
      [3, card('EXC')],
    ]);
    expect(getLegalActions(deal, 4)[0]).toMatchObject({ cards: FIVE_HANDS[4] });
  });

  it('is free again from the second trick', () => {
    const deal = play(takeWith(fiveDeal(4), 1, 'gardeSans'), [
      [1, callKing('S14')],
      [1, noChelem],
      [0, card('T02')],
      [1, card('T07')],
      [2, card('T12')],
      [3, card('T17')],
      [4, card('S11')],
    ]);
    expect(deal.turn).toBe(3);
    expect(getLegalActions(deal, 3)[0]).toMatchObject({
      cards: FIVE_HANDS[3]?.filter((c) => c !== 'T17'),
    });
  });

  it('lets a leader holding only the called suit (and the Excuse) lead it', () => {
    const spades = ALL_CARDS.filter((c) => c.startsWith('S'));
    const rest = ALL_CARDS.filter((c) => !c.startsWith('S') && c !== 'EXC');
    const hands: Card[][] = [
      [...spades, 'EXC'],
      ...[0, 1, 2, 3].map((i) => rest.slice(i * 15, i * 15 + 15)),
    ];
    const deal = play(
      takeWith(createDealFromHands({ hands, chien: rest.slice(60), dealer: 4 }), 1, 'gardeSans'),
      [
        [1, callKing('S14')],
        [1, noChelem],
      ],
    );
    expect(getLegalActions(deal, 0)[0]).toMatchObject({ cards: hands[0] });
  });
});

describe('partner in the player view (5 players)', () => {
  const called = play(takeWith(fiveDeal(4), 0, 'gardeSans'), [
    [0, callKing('H14')],
    [0, noChelem],
  ]);

  it('shows the called card to everyone, and the partner only to its holder', () => {
    expect(getPlayerView(called, 4)).toMatchObject({ calledCard: 'H14', knownPartner: 4 });
    for (const seat of [0, 1, 2, 3]) {
      expect(getPlayerView(called, seat)).toMatchObject({ calledCard: 'H14', knownPartner: null });
    }
  });

  it('reveals the partner to everyone once the called card is played', () => {
    const played = play(called, [
      [0, card('T02')],
      [1, card('T07')],
      [2, card('T12')],
      [3, card('T17')],
      [4, card('H14')],
    ]);
    expect(getPlayerView(played, 1).knownPartner).toBe(4);
  });

  it('tells the taker holding the called King they play alone, and nobody else', () => {
    const own = play(takeWith(fiveDeal(), 4, 'gardeSans'), [[4, callKing('S14')]]);
    expect(getPlayerView(own, 4).knownPartner).toBe('alone');
    expect(getPlayerView(own, 0).knownPartner).toBeNull();
  });

  it('keeps telling the taker they play alone after discarding the called card', () => {
    const { hands, chien } = swapCards(FIVE_HANDS, FIVE_CHIEN, 'C13', 'C14');
    const deal = play(takeWith(createDealFromHands({ hands, chien, dealer: 0 }), 4, 'petite'), [
      [4, callKing('S13')],
      [4, { type: 'ecart', cards: ['S11', 'S12', 'S13'] }],
    ]);
    expect(getPlayerView(deal, 4).knownPartner).toBe('alone');
  });

  it('tells everyone the taker plays alone when the revealed chien holds the called King', () => {
    const inChien = play(takeWith(fiveDeal(), 0, 'petite'), [[0, callKing('C14')]]);
    expect(getPlayerView(inChien, 2).knownPartner).toBe('alone');
  });

  it('hides a called King left in a hidden chien until the deal ends', () => {
    const hidden = play(takeWith(fiveDeal(), 0, 'gardeSans'), [[0, callKing('C14')]]);
    expect(getPlayerView(hidden, 0).knownPartner).toBeNull();
    const finished = playRandomly(hidden, 1);
    expect(finished.phase).toBe('finished');
    expect(getPlayerView(finished, 2).knownPartner).toBe('alone');
  });
});
