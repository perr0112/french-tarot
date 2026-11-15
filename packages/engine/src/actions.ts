import { applyBid, legalBids } from './bidding';
import type { Card } from './cards';
import type { BidChoice, DealState, Seat } from './deal';
import { applyChelemDecision, applyEcart, ecartTemplate, type EcartTemplate } from './ecart';
import { fail, type ActionResult } from './result';

export type Action =
  | { readonly type: 'bid'; readonly contract: BidChoice }
  | { readonly type: 'ecart'; readonly cards: readonly Card[] }
  | { readonly type: 'decideChelem'; readonly announce: boolean };

/** What a seat may do now, as templates (AGENTS.md §2, engine design rules). */
export type LegalAction =
  | { readonly type: 'bid'; readonly choices: readonly BidChoice[] }
  | EcartTemplate
  | { readonly type: 'decideChelem' };

export function applyAction(state: DealState, seat: Seat, action: Action): ActionResult {
  if (state.turn !== seat) return fail('NOT_YOUR_TURN');
  switch (action.type) {
    case 'bid':
      return state.phase === 'bidding' ? applyBid(state, seat, action.contract) : fail('WRONG_PHASE');
    case 'ecart':
      return state.phase === 'ecart' ? applyEcart(state, seat, action.cards) : fail('WRONG_PHASE');
    case 'decideChelem':
      return state.phase === 'chelemDecision'
        ? applyChelemDecision(state, action.announce)
        : fail('WRONG_PHASE');
  }
}

export function getLegalActions(state: DealState, seat: Seat): LegalAction[] {
  if (state.turn !== seat) return [];
  switch (state.phase) {
    case 'bidding':
      return [{ type: 'bid', choices: legalBids(state) }];
    case 'ecart':
      return [ecartTemplate(state, seat)];
    case 'chelemDecision':
      return [{ type: 'decideChelem' }];
    default:
      return [];
  }
}
