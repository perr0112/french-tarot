import { getLegalActions, type LegalAction } from './actions';
import { isTrump, type Card } from './cards';
import type { Bid, CancelReason, Contract, DealState, Phase, Seat } from './deal';
import type { CurrentTrick, Trick } from './play';
import type { Poignee } from './poignee';
import type { Breakdown } from './scoring';

/**
 * What one seat may know about a deal (AGENTS.md §2): its own hand and what the rules reveal.
 * Never other hands, the écart (except shown trumps), a hidden chien, or older tricks.
 */
export interface PlayerView {
  readonly seat: Seat;
  readonly players: number;
  readonly dealer: Seat;
  readonly phase: Phase;
  readonly turn: Seat | null;
  readonly hand: readonly Card[];
  readonly handSizes: readonly number[];
  readonly legalActions: readonly LegalAction[];
  readonly bids: readonly Bid[];
  readonly taker: Seat | null;
  readonly contract: Contract | null;
  /** The chien, once revealed in petite or garde; null otherwise. */
  readonly chien: readonly Card[] | null;
  readonly shownEcartTrumps: readonly Card[];
  /** The whole écart, for the taker only. */
  readonly ownEcart: readonly Card[] | null;
  readonly chelemAnnounced: boolean;
  readonly poignees: readonly Poignee[];
  readonly currentTrick: CurrentTrick | null;
  readonly lastTrick: Trick | null;
  readonly tricksWon: readonly number[];
  readonly result: Breakdown | null;
  readonly cancelled: CancelReason | null;
}

const chienRevealed = (state: DealState) =>
  state.phase !== 'bidding' && (state.contract === 'petite' || state.contract === 'garde');

export function getPlayerView(state: DealState, seat: Seat): PlayerView {
  return {
    seat,
    players: state.players,
    dealer: state.dealer,
    phase: state.phase,
    turn: state.turn,
    hand: state.hands[seat] ?? [],
    handSizes: state.hands.map((hand) => hand.length),
    legalActions: getLegalActions(state, seat),
    bids: state.bids,
    taker: state.taker,
    contract: state.contract,
    chien: chienRevealed(state) ? state.chien : null,
    shownEcartTrumps: state.ecart.filter(isTrump),
    ownEcart: seat === state.taker && state.ecart.length > 0 ? state.ecart : null,
    chelemAnnounced: state.chelemAnnounced,
    poignees: state.poignees,
    currentTrick: state.currentTrick,
    lastTrick: state.tricks.at(-1) ?? null,
    tricksWon: state.hands.map((_, s) => state.tricks.filter((t) => t.winner === s).length),
    result: state.result,
    cancelled: state.cancelled,
  };
}
