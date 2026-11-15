/** Phase transitions between the bidding and the first card (AGENTS.md §2, deal phases). */
import { CONTRACT_RULES, type Contract } from './contracts';
import { nextSeat, type DealState, type Seat } from './deal';

/**
 * Once the contract (and in 5 players the called King) is settled: in petite or garde the taker
 * takes the chien and makes the écart, otherwise the chien stays aside.
 */
export function startEcartOrChelem(state: DealState): DealState {
  const taker = state.taker as Seat;
  if (CONTRACT_RULES[state.contract as Contract].chien !== 'takerHand') {
    return startChelemDecisionOrPlay(state);
  }
  const hands = state.hands.map((hand, seat) =>
    seat === taker ? [...hand, ...state.chien] : hand,
  );
  return { ...state, hands, phase: 'ecart', turn: taker };
}

/** Once the contract is settled: the taker decides on a chelem (if enabled), else play starts. */
export function startChelemDecisionOrPlay(state: DealState): DealState {
  if (state.options.chelemAnnouncements) {
    return { ...state, phase: 'chelemDecision', turn: state.taker };
  }
  return { ...state, phase: 'playing', turn: nextSeat(state.dealer, state.players) };
}
