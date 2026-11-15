import { applyBid, legalBids } from './bidding';
import type { BidChoice, DealState, Seat } from './deal';
import { fail, type ActionResult } from './result';

export type Action = { readonly type: 'bid'; readonly contract: BidChoice };

/** What a seat may do now, as templates (AGENTS.md §2, engine design rules). */
export type LegalAction = { readonly type: 'bid'; readonly choices: readonly BidChoice[] };

export function applyAction(state: DealState, seat: Seat, action: Action): ActionResult {
  if (state.turn !== seat) return fail('NOT_YOUR_TURN');
  switch (action.type) {
    case 'bid':
      return state.phase === 'bidding' ? applyBid(state, seat, action.contract) : fail('WRONG_PHASE');
  }
}

export function getLegalActions(state: DealState, seat: Seat): LegalAction[] {
  if (state.turn !== seat) return [];
  switch (state.phase) {
    case 'bidding':
      return [{ type: 'bid', choices: legalBids(state) }];
    default:
      return [];
  }
}
