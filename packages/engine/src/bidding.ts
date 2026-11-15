import { fail, type ActionResult } from './result';
import { CONTRACTS, nextSeat, type BidChoice, type Contract, type DealState, type Seat } from './deal';

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

/** Moves from bidding to the écart (petite, garde), or to the chelem decision / play. */
function startContract(state: DealState, taker: Seat, contract: Contract): DealState {
  const withContract: DealState = { ...state, taker, contract };
  if (contract === 'petite' || contract === 'garde') {
    const hands = state.hands.map((hand, seat) =>
      seat === taker ? [...hand, ...state.chien] : hand,
    );
    return { ...withContract, hands, phase: 'ecart', turn: taker };
  }
  return startChelemDecisionOrPlay(withContract);
}

export function startChelemDecisionOrPlay(state: DealState): DealState {
  if (state.options.chelemAnnouncements) {
    return { ...state, phase: 'chelemDecision', turn: state.taker };
  }
  return { ...state, phase: 'playing', turn: nextSeat(state.dealer, state.players) };
}
