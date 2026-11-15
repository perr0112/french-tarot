import { applyAction, type Action } from './actions';
import {
  DEFAULT_DEAL_OPTIONS,
  createDeal,
  nextSeat,
  type CancelReason,
  type DealOptions,
  type DealState,
  type Seat,
} from './deal';
import type { EngineError } from './result';
import type { Breakdown } from './scoring';
import type { PlayerCount } from './variant';

/** One line of the score sheet: a played deal, or a cancelled one (ADR-0002). */
export interface SessionDealRecord {
  readonly dealer: Seat;
  readonly result: Breakdown | null;
  readonly cancelled: CancelReason | null;
}

/** A series of N played deals at one room, with a cumulative score sheet. */
export interface SessionState {
  readonly players: PlayerCount;
  readonly options: DealOptions;
  /** Number of played deals the session lasts. */
  readonly deals: number;
  readonly phase: 'waitingForDeal' | 'dealing' | 'finished';
  readonly dealer: Seat;
  readonly deal: DealState | null;
  readonly played: number;
  readonly history: readonly SessionDealRecord[];
  readonly totals: readonly number[];
}

export type SessionAction =
  | { readonly type: 'deal'; readonly seed: number }
  | { readonly type: 'play'; readonly seat: Seat; readonly action: Action };

export type SessionErrorCode = 'NO_DEAL_IN_PROGRESS' | 'DEAL_IN_PROGRESS' | 'SESSION_OVER';

export type SessionResult =
  | { readonly ok: true; readonly session: SessionState }
  | { readonly ok: false; readonly error: EngineError | { readonly code: SessionErrorCode } };

export interface CreateSessionInput {
  readonly players: PlayerCount;
  readonly deals: number;
  readonly dealer: Seat;
  readonly options?: DealOptions;
}

export function createSession({
  players,
  deals,
  dealer,
  options,
}: CreateSessionInput): SessionState {
  return {
    players,
    options: options ?? DEFAULT_DEAL_OPTIONS,
    deals,
    phase: 'waitingForDeal',
    dealer,
    deal: null,
    played: 0,
    history: [],
    totals: Array.from({ length: players }, () => 0),
  };
}

const failWith = (code: SessionErrorCode): SessionResult => ({ ok: false, error: { code } });

export function applySessionAction(session: SessionState, action: SessionAction): SessionResult {
  if (session.phase === 'finished') return failWith('SESSION_OVER');
  switch (action.type) {
    case 'deal': {
      if (session.deal !== null) return failWith('DEAL_IN_PROGRESS');
      const deal = createDeal({
        players: session.players,
        dealer: session.dealer,
        seed: action.seed,
        options: session.options,
      });
      return { ok: true, session: settle({ ...session, phase: 'dealing', deal }) };
    }
    case 'play': {
      if (session.deal === null) return failWith('NO_DEAL_IN_PROGRESS');
      const result = applyAction(session.deal, action.seat, action.action);
      if (!result.ok) return result;
      return { ok: true, session: settle({ ...session, deal: result.state }) };
    }
  }
}

/** Closes the current deal if it is over: records it, updates totals, moves the dealer on. */
function settle(session: SessionState): SessionState {
  const deal = session.deal;
  if (deal === null || (deal.phase !== 'finished' && deal.phase !== 'cancelled')) return session;

  const record: SessionDealRecord = {
    dealer: deal.dealer,
    result: deal.result,
    cancelled: deal.cancelled,
  };
  const counted = deal.result !== null;
  const played = session.played + (counted ? 1 : 0);
  const totals = session.totals.map((total, seat) => total + (deal.result?.perSeat[seat] ?? 0));
  return {
    ...session,
    deal: null,
    phase: played >= session.deals ? 'finished' : 'waitingForDeal',
    dealer: nextSeat(session.dealer, session.players),
    played,
    history: [...session.history, record],
    totals,
  };
}
