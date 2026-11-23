import {
  ALL_CARDS,
  applyAction,
  createDealFromHands,
  getPlayerView,
  type Action,
  type Card,
  type Contract,
  type DealState,
  type Seat,
} from '@tarot/engine';
import { DEFAULT_ROOM_OPTIONS, type RoomView } from '@tarot/protocol';

/** A 4-player deal where seat 0 holds `hand`, the rest dealt in card order (dealer 3 by default). */
export function dealWith(hand: readonly Card[], dealer: Seat = 3): DealState {
  const rest = ALL_CARDS.filter((c) => !hand.includes(c));
  return createDealFromHands({
    hands: [hand, rest.slice(0, 18), rest.slice(18, 36), rest.slice(36, 54)],
    chien: rest.slice(54),
    dealer,
  });
}

export function playOut(deal: DealState, moves: readonly [Seat, Action][]): DealState {
  return moves.reduce((state, [seat, action]) => {
    const result = applyAction(state, seat, action);
    if (!result.ok) throw new Error(`${seat} ${JSON.stringify(action)}: ${result.error.code}`);
    return result.state;
  }, deal);
}

/** Seat 0 takes `contract`, the others pass (a garde contre ends the bidding at once). */
export function takes(deal: DealState, contract: Contract): DealState {
  const taken = playOut(deal, [[0, { type: 'bid', contract }]]);
  if (taken.phase !== 'bidding') return taken;
  return playOut(taken, [
    [1, { type: 'bid', contract: 'pass' }],
    [2, { type: 'bid', contract: 'pass' }],
    [3, { type: 'bid', contract: 'pass' }],
  ]);
}

/** The room snapshot seat `seat` would receive while `deal` is in play. */
export function roomView(
  deal: DealState | null,
  seat: Seat = 0,
  overrides: Partial<RoomView> = {},
): RoomView {
  return {
    code: 'ABCDEF',
    phase: 'playing',
    options: DEFAULT_ROOM_OPTIONS,
    you: { nickname: 'Alice', seat, isHost: seat === 0 },
    seats: [
      { kind: 'human', nickname: 'Alice', connected: true, replacedByBot: false, autoplay: false },
      { kind: 'bot', level: 'medium', number: 1 },
      { kind: 'human', nickname: 'Bob', connected: true, replacedByBot: false, autoplay: false },
      { kind: 'bot', level: 'easy', number: 2 },
    ],
    waiting: [],
    session: { deals: 8, played: 0, dealer: 3, totals: [0, 0, 0, 0], history: [], continued: null },
    deal: deal ? getPlayerView(deal, seat) : null,
    canAbandonDeal: false,
    replayReady: null,
    ...overrides,
  };
}
