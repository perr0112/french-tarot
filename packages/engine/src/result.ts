import type { DealState } from './deal';

export type ErrorCode =
  | 'NOT_YOUR_TURN'
  | 'WRONG_PHASE'
  | 'BID_TOO_LOW'
  | 'CARD_NOT_IN_HAND'
  | 'CALLED_CARD_INVALID'
  | 'ECART_WRONG_COUNT'
  | 'ECART_FORBIDDEN_CARD'
  | 'ECART_TRUMP_AVOIDABLE'
  | 'CARD_NOT_PLAYABLE'
  | 'POIGNEE_NOT_FIRST_CARD'
  | 'POIGNEE_INVALID'
  | 'UNKNOWN_ACTION';

export interface EngineError {
  readonly code: ErrorCode;
}

export type ActionResult =
  | { readonly ok: true; readonly state: DealState }
  | { readonly ok: false; readonly error: EngineError };

/** A failed result carrying a typed error code. */
export const failure = <Code extends string>(code: Code) =>
  ({ ok: false, error: { code } }) as const;

export const fail = (code: ErrorCode): ActionResult => failure(code);
