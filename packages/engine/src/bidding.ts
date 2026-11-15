import { fail, type ActionResult } from './result';
import { CONTRACTS, type BidChoice, type Contract } from './contracts';
import { nextSeat, type DealState, type Seat } from './deal';
import { startEcartOrChelem } from './phases';
import { hasKingCall } from './variant';

const rank = (contract: Contract): number => CONTRACTS.indexOf(contract);

function highestBid(state: DealState): { seat: Seat; contract: Contract } | null {
  let best: { seat: Seat; contract: Contract } | null = null;
  for (const { seat, contract } of state.bids) {
    if (contract !== 'pass' && (best === null || rank(contract) > rank(best.contract))) {
      best = { seat, contract };
    }
  }
  return best;
}

export function legalBids(state: DealState): BidChoice[] {
  const best = highestBid(state);
  const floor = best === null ? 0 : rank(best.contract) + 1;
  return ['pass', ...CONTRACTS.slice(floor)];
}

export function applyBid(state: DealState, seat: Seat, contract: BidChoice): ActionResult {
  if (!legalBids(state).includes(contract)) return fail('BID_TOO_LOW');
  const bidding: DealState = { ...state, bids: [...state.bids, { seat, contract }] };

  const everyoneSpoke = bidding.bids.length === state.players;
  const unbeatable = contract === 'gardeContre';
  if (!everyoneSpoke && !unbeatable) {
    return { ok: true, state: { ...bidding, turn: nextSeat(seat, state.players) } };
  }

  const best = highestBid(bidding);
  if (best === null) {
    return {
      ok: true,
      state: { ...bidding, phase: 'cancelled', turn: null, cancelled: { reason: 'allPassed' } },
    };
  }
  return { ok: true, state: startContract(bidding, best.seat, best.contract) };
}

/** Moves from bidding to the king call (5 players), else on to the écart or the chelem decision. */
function startContract(state: DealState, taker: Seat, contract: Contract): DealState {
  const withContract: DealState = { ...state, taker, contract };
  if (hasKingCall(state.players)) {
    return { ...withContract, phase: 'kingCall', turn: taker };
  }
  return startEcartOrChelem(withContract);
}
