import { nextSeat, type DealState } from './deal';
import type { ActionResult } from './result';

/** Once the contract is settled: the taker decides on a chelem (if enabled), else play starts. */
export function startChelemDecisionOrPlay(state: DealState): DealState {
  if (state.options.chelemAnnouncements) {
    return { ...state, phase: 'chelemDecision', turn: state.taker };
  }
  return { ...state, phase: 'playing', turn: nextSeat(state.dealer, state.players) };
}

/** An announced chelem gives the taker the first lead (AGENTS.md §3.6). */
export function applyChelemDecision(state: DealState, announce: boolean): ActionResult {
  const turn = announce ? state.taker : nextSeat(state.dealer, state.players);
  return { ok: true, state: { ...state, phase: 'playing', turn, chelemAnnounced: announce } };
}
