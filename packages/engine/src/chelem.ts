import { nextSeat, type DealState } from './deal';
import type { ActionResult } from './result';

/** An announced chelem gives the taker the first lead (AGENTS.md §3.6). */
export function applyChelemDecision(state: DealState, announce: boolean): ActionResult {
  const turn = announce ? state.taker : nextSeat(state.dealer, state.players);
  return { ok: true, state: { ...state, phase: 'playing', turn, chelemAnnounced: announce } };
}
