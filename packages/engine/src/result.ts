import type { DealState } from './deal';

export type ErrorCode =
  | 'NOT_YOUR_TURN'
  | 'WRONG_PHASE'
  | 'BID_TOO_LOW'
  | 'CARD_NOT_IN_HAND'
  | 'ECART_WRONG_COUNT'
  | 'ECART_FORBIDDEN_CARD'
  | 'ECART_TRUMP_AVOIDABLE';

export interface EngineError {
  readonly code: ErrorCode;
}

export type ActionResult =
  | { readonly ok: true; readonly state: DealState }
  | { readonly ok: false; readonly error: EngineError };

export const fail = (code: ErrorCode): ActionResult => ({ ok: false, error: { code } });
