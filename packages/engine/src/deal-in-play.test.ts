import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createDeal,
  createDealInPlay,
  getLegalActions,
  playedCards,
  type CreateDealInPlayInput,
  type DealState,
  type Seat,
} from './index';
import { choices, playRandomly, randomAction } from './testing/random-player';

/** Plays randomly until `cards` cards have been played; null if the deal never gets there. */
function playUntil(start: DealState, seed: number, cards: number): DealState | null {
  const pick = choices(seed);
  let state = start;
  while (!(state.phase === 'playing' && playedCards(state).length >= cards)) {
    if (state.phase === 'finished' || state.phase === 'cancelled') return null;
    const seat = state.turn as Seat;
    const [template] = getLegalActions(state, seat);
    if (!template) return null;
    const result = applyAction(state, seat, randomAction(template, pick));
    if (!result.ok) throw new Error(result.error.code);
    state = result.state;
  }
  return state;
}

/** What a simulation knows: the public history plus one full guess of the hidden cards. */
const inputOf = (state: DealState): CreateDealInPlayInput => ({
  players: state.players,
  dealer: state.dealer,
  options: state.options,
  bids: state.bids,
  taker: state.taker as Seat,
  contract: state.contract as NonNullable<DealState['contract']>,
  calledCard: state.calledCard,
  chelemAnnounced: state.chelemAnnounced,
  poignees: state.poignees,
  tricks: state.tricks,
  currentTrick: state.currentTrick,
  hands: state.hands,
  chien: state.chien,
  ecart: state.ecart,
});

describe('createDealInPlay', () => {
  it.each([3, 4, 5] as const)(
    'rebuilds a deal in play from its history and hidden cards (%i players)',
    (players) => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2 ** 31 - 1 }),
          fc.integer(),
          fc.integer({ min: 0, max: 70 }),
          (seed, choiceSeed, cards) => {
            const state = playUntil(createDeal({ players, dealer: 0, seed }), choiceSeed, cards);
            if (state === null) return;
            const rebuilt = createDealInPlay(inputOf(state));
            expect(rebuilt).toEqual(state);
            // It plays on and scores exactly like the real deal.
            expect(playRandomly(rebuilt, choiceSeed)).toEqual(playRandomly(state, choiceSeed));
          },
        ),
        { numRuns: 150 },
      );
    },
  );

  const sample = () => {
    for (let seed = 1; ; seed++) {
      const state = playUntil(createDeal({ players: 4, dealer: 0, seed }), seed, 10);
      if (state) return state;
    }
  };

  it('refuses a card held twice', () => {
    const state = sample();
    const [first, second] = state.hands;
    const hands = [first, [first?.[0], ...(second ?? []).slice(1)], ...state.hands.slice(2)];
    expect(() => createDealInPlay({ ...inputOf(state), hands } as CreateDealInPlayInput)).toThrow(
      'Invalid distribution',
    );
  });

  it('refuses a hand of the wrong size', () => {
    const state = sample();
    const hands = state.hands.map((hand, seat) => (seat === 1 ? hand.slice(1) : hand));
    expect(() => createDealInPlay({ ...inputOf(state), hands })).toThrow('Invalid distribution');
  });

  it('refuses a King or an oudler in the écart', () => {
    for (let seed = 1; ; seed++) {
      const state = playUntil(createDeal({ players: 4, dealer: 0, seed }), seed, 10);
      if (state === null || state.ecart.length === 0) continue;
      const taker = state.taker as Seat;
      // Swap a discarded card with a King still held by the taker, if any.
      const king = state.hands[taker]?.find((c) => c.endsWith('14'));
      if (!king) continue;
      const [discarded] = state.ecart;
      const hands = state.hands.map((hand, seat) =>
        seat === taker ? hand.map((c) => (c === king ? (discarded as typeof c) : c)) : hand,
      );
      const ecart = state.ecart.map((c) => (c === discarded ? king : c));
      expect(() => createDealInPlay({ ...inputOf(state), hands, ecart })).toThrow(
        'Invalid distribution',
      );
      return;
    }
  });

  it('refuses a trick played out of seat order', () => {
    const state = sample();
    const [first, ...rest] = state.tricks;
    if (!first) throw new Error('No trick played');
    const cards = [...first.cards].reverse();
    expect(() =>
      createDealInPlay({ ...inputOf(state), tricks: [{ ...first, cards }, ...rest] }),
    ).toThrow('Invalid distribution');
  });

  it('refuses a current trick led by the wrong seat', () => {
    const state = sample();
    const current = state.currentTrick ?? { leader: 0, cards: [] };
    const leader = (current.leader + 1) % state.players;
    expect(() =>
      createDealInPlay({ ...inputOf(state), currentTrick: { ...current, leader } }),
    ).toThrow('Invalid distribution');
  });
});
