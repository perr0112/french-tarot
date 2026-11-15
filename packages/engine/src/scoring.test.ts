import { describe, expect, it } from 'vitest';
import {
  createDealFromHands,
  getLegalActions,
  scoreDeal,
  type Card,
  type DealState,
  type ScoreFacts,
  type Seat,
} from './index';
import {
  callKing,
  card,
  fiveDeal,
  FIVE_CHIEN,
  FIVE_HANDS,
  play,
  swapCards,
  takeWith,
} from './testing/fixtures';
import { dealFacts } from './index';

const facts = (overrides: Partial<ScoreFacts>): ScoreFacts => ({
  players: 4,
  taker: 0,
  partner: null,
  contract: 'petite',
  takerHalfPoints: 0,
  takerOudlers: 0,
  petitAuBout: null,
  poignees: [],
  chelem: { announced: false, achievedBy: null },
  ...overrides,
});

describe('scoreDeal (hand-computed golden examples)', () => {
  it('matches the FFT rulebook chelem example: (46 + 25) × 2 + 20 + 20 + 400 = 582', () => {
    // Garde, 87 points with 2 oudlers, simple poignée, petit au bout, announced chelem made.
    const result = scoreDeal(
      facts({
        contract: 'garde',
        takerHalfPoints: 174,
        takerOudlers: 2,
        petitAuBout: 'taker',
        poignees: [{ seat: 0, level: 'simple' }],
        chelem: { announced: true, achievedBy: 'taker' },
      }),
    );
    expect(result).toMatchObject({ gap: 46, dealScore: 582, perSeat: [1746, -582, -582, -582] });
  });

  it('scores a made garde: (25 + 4) × 2 = 58', () => {
    const result = scoreDeal(facts({ contract: 'garde', takerHalfPoints: 90, takerOudlers: 2 }));
    expect(result).toMatchObject({
      points: 45,
      needed: 41,
      made: true,
      gap: 4,
      multiplier: 2,
      contractScore: 58,
      dealScore: 58,
      perSeat: [174, -58, -58, -58],
    });
  });

  it('matches the FFT rulebook example of a failed petite: −(25 + 7) + 10 − 20 = −42', () => {
    // Failed by 7, petit au bout for the taker, simple poignée shown by a defender.
    const result = scoreDeal(
      facts({
        takerHalfPoints: 88,
        takerOudlers: 1,
        petitAuBout: 'taker',
        poignees: [{ seat: 2, level: 'simple' }],
      }),
    );
    expect(result).toMatchObject({
      points: 44,
      needed: 51,
      made: false,
      contractScore: -32,
      petitAuBout: 10,
      poignee: -20,
      dealScore: -42,
      perSeat: [-126, 42, 42, 42],
    });
  });

  it('signs a petit au bout for the defence against the taker, even when the contract is made', () => {
    const result = scoreDeal(
      facts({ contract: 'gardeSans', takerHalfPoints: 112, petitAuBout: 'defence' }),
    );
    expect(result).toMatchObject({ contractScore: 100, petitAuBout: -40, dealScore: 60 });
  });

  it('gives the poignée bonus to the side that wins the contract, unmultiplied', () => {
    const result = scoreDeal(
      facts({
        contract: 'garde',
        takerHalfPoints: 82,
        takerOudlers: 2,
        poignees: [{ seat: 1, level: 'double' }],
      }),
    );
    expect(result).toMatchObject({ contractScore: 50, poignee: 30, dealScore: 80 });
  });

  it('adds 400 for an announced and made chelem', () => {
    const result = scoreDeal(
      facts({
        takerHalfPoints: 182,
        takerOudlers: 3,
        petitAuBout: 'taker',
        chelem: { announced: true, achievedBy: 'taker' },
      }),
    );
    expect(result).toMatchObject({
      contractScore: 80,
      petitAuBout: 10,
      chelem: 400,
      dealScore: 490,
    });
  });

  it('adds 200 for an unannounced chelem', () => {
    const result = scoreDeal(
      facts({
        takerHalfPoints: 182,
        takerOudlers: 3,
        chelem: { announced: false, achievedBy: 'taker' },
      }),
    );
    expect(result).toMatchObject({ chelem: 200, dealScore: 280 });
  });

  it('takes 200 for an announced chelem that fails, even if the contract is made', () => {
    const result = scoreDeal(
      facts({
        contract: 'garde',
        takerHalfPoints: 120,
        takerOudlers: 2,
        chelem: { announced: true, achievedBy: null },
      }),
    );
    expect(result).toMatchObject({ contractScore: 88, chelem: -200, dealScore: -112 });
  });

  it('gives each defender 200 more when the defence wins every trick', () => {
    const result = scoreDeal(facts({ chelem: { announced: false, achievedBy: 'defence' } }));
    expect(result).toMatchObject({ contractScore: -81, chelem: -200, dealScore: -281 });
    expect(result.perSeat).toEqual([-843, 281, 281, 281]);
  });
});

/** Plays the deal out: the taker follows `takerPick`, defenders play their first legal card. */
function playOut(start: DealState, takerPick: (cards: Card[]) => Card): DealState {
  let state = start;
  while (state.phase === 'playing') {
    const seat = state.turn as Seat;
    const legal = getLegalActions(state, seat).find((a) => a.type === 'playCard');
    const cards = legal && legal.type === 'playCard' ? [...legal.cards].sort() : [];
    state = play(state, [
      [seat, card(seat === state.taker ? takerPick(cards) : (cards[0] as Card))],
    ]);
  }
  return state;
}

/** Highest trump first, other cards next, the Excuse last. */
const strongestFirst = (cards: Card[]): Card =>
  cards.filter((c) => c.startsWith('T')).at(-1) ??
  cards.find((c) => c !== 'EXC') ??
  ('EXC' as Card);

describe('scoring a played deal', () => {
  it('scores an announced chelem won with the Excuse on the last trick', () => {
    // Seat 1 holds T05–T21 and the Excuse; garde sans, chelem announced.
    const hands: Card[][] = [
      [
        'S01',
        'S02',
        'S03',
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
        'S14',
        'H01',
        'H02',
        'H03',
        'H04',
      ],
      [
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
        'T16',
        'T17',
        'T18',
        'T19',
        'T20',
        'T21',
        'EXC',
      ],
      [
        'T01',
        'T02',
        'T03',
        'T04',
        'H05',
        'H06',
        'H07',
        'H08',
        'H09',
        'H10',
        'H11',
        'H12',
        'H13',
        'H14',
        'D01',
        'D02',
        'D03',
        'D04',
      ],
      [
        'D05',
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
      ],
    ];
    const chien: Card[] = ['C09', 'C10', 'C11', 'C12', 'C13', 'C14'];
    const deal = play(takeWith(createDealFromHands({ hands, chien, dealer: 0 }), 1, 'gardeSans'), [
      [1, { type: 'decideChelem', announce: true }],
    ]);
    const done = playOut(deal, strongestFirst);
    expect(done.tricks.at(-1)).toMatchObject({ leader: 1, winner: 1 });
    expect(done.result).toMatchObject({
      points: 91,
      oudlers: 3,
      chelem: 400,
      petitAuBout: 0,
      dealScore: 720,
      perSeat: [-720, 2160, -720, -720],
    });
  });

  it('counts the Petit au bout on the second-to-last trick when a chelem ends with the Excuse', () => {
    // Seat 1 holds the Petit, T06–T21 and the Excuse; it plays the Petit on trick 17.
    const hands: Card[][] = [
      [
        'S01',
        'S02',
        'S03',
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
        'S14',
        'H01',
        'H02',
        'H03',
        'H04',
      ],
      [
        'T01',
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
        'T16',
        'T17',
        'T18',
        'T19',
        'T20',
        'T21',
        'EXC',
      ],
      [
        'T02',
        'T03',
        'T04',
        'T05',
        'H05',
        'H06',
        'H07',
        'H08',
        'H09',
        'H10',
        'H11',
        'H12',
        'H13',
        'H14',
        'D01',
        'D02',
        'D03',
        'D04',
      ],
      [
        'D05',
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
      ],
    ];
    const chien: Card[] = ['C09', 'C10', 'C11', 'C12', 'C13', 'C14'];
    const deal = play(takeWith(createDealFromHands({ hands, chien, dealer: 0 }), 1, 'gardeSans'), [
      [1, { type: 'decideChelem', announce: true }],
    ]);
    const done = playOut(deal, strongestFirst);
    expect(done.tricks.at(-2)?.cards[0]).toEqual({ seat: 1, card: 'T01' });
    expect(done.result).toMatchObject({ petitAuBout: 40, chelem: 400, dealScore: 760 });
  });

  it('gives an Excuse played on the last trick to the side that wins it, outside a chelem', () => {
    // As above, but the taker loses the first trick (leading S01), so there is no chelem.
    const hands: Card[][] = [
      [
        'S02',
        'S03',
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
        'S14',
        'H01',
        'H02',
        'H03',
        'H04',
        'H05',
      ],
      [
        'S01',
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
        'T16',
        'T17',
        'T18',
        'T19',
        'T20',
        'T21',
        'EXC',
      ],
      [
        'T01',
        'T02',
        'T03',
        'T04',
        'T05',
        'H06',
        'H07',
        'H08',
        'H09',
        'H10',
        'H11',
        'H12',
        'H13',
        'H14',
        'D01',
        'D02',
        'D03',
        'D04',
      ],
      [
        'D05',
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
      ],
    ];
    const chien: Card[] = ['C09', 'C10', 'C11', 'C12', 'C13', 'C14'];
    const deal = takeWith(
      createDealFromHands({ hands, chien, dealer: 0, options: { chelemAnnouncements: false } }),
      1,
      'gardeSans',
    );
    const done = playOut(deal, (cards) => (cards.includes('S01') ? 'S01' : strongestFirst(cards)));
    const last = done.tricks.at(-1);
    expect(last?.cards[0]).toEqual({ seat: 1, card: 'EXC' });
    expect(last?.winner).not.toBe(1);
    // Petit lost on the first trick, Excuse lost on the last: only the 21 remains.
    expect(done.result).toMatchObject({ oudlers: 1, needed: 51, chelem: 0 });
  });
});

describe('scoring in 3 and 5 players', () => {
  it('gives the taker 2S against two defenders in 3 players', () => {
    const result = scoreDeal(
      facts({ players: 3, contract: 'garde', takerHalfPoints: 90, takerOudlers: 2 }),
    );
    expect(result.perSeat).toEqual([116, -58, -58]);
  });

  it('gives the half point to the winning side: 40.5 with 2 oudlers fails by 1', () => {
    const result = scoreDeal(facts({ players: 3, takerHalfPoints: 81, takerOudlers: 2 }));
    expect(result).toMatchObject({ points: 40.5, made: false, gap: 1, contractScore: -26 });
  });

  it('gives the half point to the winning side: 41.5 with 2 oudlers makes by 1', () => {
    const result = scoreDeal(facts({ players: 3, takerHalfPoints: 83, takerOudlers: 2 }));
    expect(result).toMatchObject({ points: 41.5, made: true, gap: 1, contractScore: 26 });
  });

  it('shares 2S to the taker, S to the partner and −S to each defender in 5 players', () => {
    const result = scoreDeal(
      facts({ players: 5, taker: 1, partner: 3, takerHalfPoints: 90, takerOudlers: 2 }),
    );
    expect(result).toMatchObject({ partner: 3, perSeat: [-29, 58, -29, 29, -29] });
  });

  it('gives a taker playing alone 4S in 5 players', () => {
    const result = scoreDeal(facts({ players: 5, takerHalfPoints: 90, takerOudlers: 2 }));
    expect(result.perSeat).toEqual([116, -29, -29, -29, -29]);
  });

  it("counts the partner's tricks for the taker's side, chelem included", () => {
    // Garde sans by seat 0 calling the King of hearts (seat 4), who wins every trick.
    // The defence keeps the Excuse (exchanged for half a point): 91 − 4.5 + 0.5 = 87 points,
    // with the Petit and the 21 from the chien. (25 + 46) × 4 + 200 = 484.
    const called = play(takeWith(fiveDeal(), 0, 'gardeSans'), [[0, callKing('H14')]]);
    const tricks = Array.from({ length: 15 }, (_, i) => ({
      leader: 0,
      cards: FIVE_HANDS.map((hand, seat) => ({
        seat,
        card: hand[(i + (seat === 3 ? 1 : 0)) % 15] as Card,
      })),
      winner: 4,
    }));
    const finished: DealState = {
      ...called,
      phase: 'finished',
      turn: null,
      hands: FIVE_HANDS.map(() => []),
      tricks,
    };
    const fiveFacts = dealFacts(finished);
    expect(fiveFacts).toMatchObject({
      partner: 4,
      takerHalfPoints: 174,
      takerOudlers: 2,
      chelem: { announced: false, achievedBy: 'taker' },
    });
    expect(scoreDeal(fiveFacts)).toMatchObject({
      dealScore: 484,
      perSeat: [968, -484, -484, -484, 484],
    });
  });

  it("counts the partner's Excuse and Petit au bout for the taker's side", () => {
    // Seat 0 holds the Petit, seat 4 (the partner, King of hearts called) the Excuse.
    // The defence (seat 1) wins every trick but the last, won by the partner with the Petit.
    const withPetit = swapCards(FIVE_HANDS, FIVE_CHIEN, 'T01', 'S01');
    const { hands, chien } = swapCards(withPetit.hands, withPetit.chien, 'EXC', 'C11');
    const dealt = createDealFromHands({ hands, chien, dealer: 0 });
    const called = play(takeWith(dealt, 0, 'gardeSans'), [[0, callKing('H14')]]);
    const last: Card[] = ['T01', 'H01', 'D01', 'C01', 'S11'];
    const rest = hands.map((hand, seat) => hand.filter((c) => c !== last[seat]));
    const tricks = [
      ...Array.from({ length: 14 }, (_, i) => ({
        leader: 1,
        cards: rest.map((hand, seat) => ({ seat, card: hand[i] as Card })),
        winner: 1,
      })),
      { leader: 4, cards: last.map((c, seat) => ({ seat, card: c })), winner: 4 },
    ];
    const fiveFacts = dealFacts({
      ...called,
      phase: 'finished',
      turn: null,
      hands: hands.map(() => []),
      tricks,
    });
    // Chien C14 + T21 + S01 (19 half-points), last trick 15 (Petit 9, three
    // small cards, Valet 3), the Excuse kept (9) minus the half point given for it:
    // 42 half-points, i.e. 21 points with 3 oudlers.
    expect(fiveFacts).toMatchObject({
      takerHalfPoints: 42,
      takerOudlers: 3,
      petitAuBout: 'taker',
      chelem: { announced: false, achievedBy: null },
    });
  });
});
