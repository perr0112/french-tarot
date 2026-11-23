import { describe, expect, it } from 'vitest';
import { createDealFromHands, getPlayerView, type Card, type DealState } from './index';
import {
  SIMPLE_CHIEN,
  SIMPLE_HANDS,
  card,
  mixedDealInPlay,
  play,
  simpleDeal,
  takeWith,
} from './testing/fixtures';

/** Every card id that appears anywhere in a view. */
const cardsIn = (view: unknown): Set<string> =>
  new Set(
    JSON.stringify(view)
      .match(/"(?:[SHDCT]\d\d|EXC)"/g)
      ?.map((s) => s.slice(1, -1)),
  );

describe('getPlayerView', () => {
  it('shows a seat its own hand and only the size of the others', () => {
    const view = getPlayerView(simpleDeal(), 1);
    expect(view).toMatchObject({
      seat: 1,
      phase: 'bidding',
      turn: 1,
      handSizes: [18, 18, 18, 18],
      chien: null,
    });
    expect(view.hand).toEqual(SIMPLE_HANDS[1]);
    expect([...cardsIn(view)].sort()).toEqual([...(SIMPLE_HANDS[1] ?? [])].sort());
  });

  it('reveals the chien to everyone in petite and garde', () => {
    const deal = takeWith(simpleDeal(), 2, 'garde');
    expect(getPlayerView(deal, 0)).toMatchObject({
      chien: SIMPLE_CHIEN,
      taker: 2,
      contract: 'garde',
    });
    expect(getPlayerView(deal, 2).hand).toHaveLength(24);
  });

  it('reveals the chien to everyone when everyone passed', () => {
    const deal = play(simpleDeal(), [
      [1, { type: 'bid', contract: 'pass' }],
      [2, { type: 'bid', contract: 'pass' }],
      [3, { type: 'bid', contract: 'pass' }],
      [0, { type: 'bid', contract: 'pass' }],
    ]);
    expect(deal.phase).toBe('cancelled');
    for (const seat of [0, 1, 2, 3]) expect(getPlayerView(deal, seat).chien).toEqual(SIMPLE_CHIEN);
  });

  it('never reveals the chien in garde sans', () => {
    const deal = takeWith(simpleDeal(), 2, 'gardeSans');
    for (const seat of [0, 1, 2, 3]) {
      expect(getPlayerView(deal, seat).chien).toBeNull();
      expect(cardsIn(getPlayerView(deal, seat))).not.toContain('T21');
    }
  });

  describe('after an écart with trumps', () => {
    // Seat 1 must discard three trumps (it holds the kings, oudlers and many trumps).
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
      [
        'D09',
        'D10',
        'D11',
        'D12',
        'D13',
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
      ],
    ];
    const chien: Card[] = ['T13', 'T14', 'T15', 'S01', 'S02', 'S03'];
    const ecart: Card[] = ['S01', 'S02', 'S03', 'T02', 'T03', 'T04'];
    const deal = play(takeWith(createDealFromHands({ hands, chien, dealer: 0 }), 1, 'petite'), [
      [1, { type: 'ecart', cards: ecart }],
    ]);

    it('shows the discarded trumps to everyone but hides the rest of the écart', () => {
      const view = getPlayerView(deal, 0);
      expect(view.shownEcartTrumps).toEqual(['T02', 'T03', 'T04']);
      expect(view.ownEcart).toBeNull();
      // S01–S03 were in the revealed chien, so they stay public; nothing else of the écart leaks.
      expect(cardsIn(view)).toContain('T02');
    });

    it('lets the taker see their whole écart', () => {
      expect(getPlayerView(deal, 1).ownEcart).toEqual(ecart);
    });
  });

  describe('during play', () => {
    const state = play(mixedDealInPlay(2), [
      [3, card('C01')],
      [0, card('T10')],
      [1, card('T14')],
      [2, card('S11')],
      [1, card('S06')],
      [2, card('S14')],
      [3, card('C02')],
    ]);

    it('shows the current trick, the last completed trick only, and tricks won per seat', () => {
      const view = getPlayerView(state, 0);
      expect(view.currentTrick).toEqual({
        leader: 1,
        cards: [
          { seat: 1, card: 'S06' },
          { seat: 2, card: 'S14' },
          { seat: 3, card: 'C02' },
        ],
      });
      expect(view.lastTrick).toMatchObject({ leader: 3, winner: 1 });
      expect(view.tricksWon).toEqual([0, 1, 0, 0]);
    });

    it('forgets older tricks', () => {
      const later = play(state, [[0, card('S01')]]);
      const view = getPlayerView(later, 0);
      expect(view.lastTrick).toMatchObject({ leader: 1, winner: 2 });
      expect(cardsIn(view)).not.toContain('C01');
    });

    it('leaks no card of another hand', () => {
      const view = getPlayerView(state, 0);
      const public_ = new Set(
        [...(view.lastTrick?.cards ?? []), ...(view.currentTrick?.cards ?? [])].map((p) => p.card),
      );
      const others = [1, 2, 3].flatMap((seat) => state.hands[seat] ?? []);
      expect(others.filter((c) => cardsIn(view).has(c) && !public_.has(c))).toEqual([]);
      expect(view.hand).toEqual(state.hands[0]);
    });
  });

  it('includes the result once the deal is finished', () => {
    let state: DealState = mixedDealInPlay(2);
    while (state.phase === 'playing') {
      const seat = state.turn as number;
      const view = getPlayerView(state, seat);
      expect(view.legalActions.length).toBeGreaterThan(0);
      const legal = view.legalActions.find((a) => a.type === 'playCard');
      const next = legal && legal.type === 'playCard' ? legal.cards[0] : undefined;
      state = play(state, [[seat, card(next as Card)]]);
    }
    expect(getPlayerView(state, 0).result).toEqual(state.result);
  });
});
