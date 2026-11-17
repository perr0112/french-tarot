import { ALL_CARDS, CONTRACTS, type Action, type Card } from '@tarot/engine';
import { z } from 'zod';
import {
  BOT_LEVELS,
  BOT_SPEEDS,
  MAX_DEALS,
  MAX_NICKNAME_LENGTH,
  type RoomOptions,
  type SeatBotLevel,
} from './options';

/** Messages a client may send to its room. */
export type ClientMessage =
  | { readonly type: 'join'; readonly nickname: string; readonly token?: string }
  | { readonly type: 'configure'; readonly options: Partial<RoomOptions> }
  | { readonly type: 'setBot'; readonly seat: number; readonly level: SeatBotLevel | null }
  | { readonly type: 'start' }
  | { readonly type: 'action'; readonly action: Action }
  | { readonly type: 'continue' }
  | { readonly type: 'newSession' }
  | { readonly type: 'backToLobby' };

const card = z.enum(ALL_CARDS as [Card, ...Card[]]);
const cards = z.array(card).max(ALL_CARDS.length);

const action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bid'), contract: z.enum(['pass', ...CONTRACTS]) }),
  z.object({ type: z.literal('callKing'), card }),
  z.object({ type: z.literal('ecart'), cards }),
  z.object({ type: z.literal('decideChelem'), announce: z.boolean() }),
  z.object({ type: z.literal('playCard'), card, poignee: cards.optional() }),
]);

const options = z.object({
  players: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
  deals: z.int().min(1).max(MAX_DEALS).optional(),
  chelemAnnouncements: z.boolean().optional(),
  botSpeed: z.enum(BOT_SPEEDS).optional(),
});

const message = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('join'),
    nickname: z.string().trim().min(1).max(MAX_NICKNAME_LENGTH),
    token: z.string().min(1).max(100).optional(),
  }),
  z.object({ type: z.literal('configure'), options }),
  z.object({
    type: z.literal('setBot'),
    seat: z.int().min(0),
    level: z.enum(BOT_LEVELS).nullable(),
  }),
  z.object({ type: z.literal('start') }),
  z.object({ type: z.literal('action'), action }),
  z.object({ type: z.literal('continue') }),
  z.object({ type: z.literal('newSession') }),
  z.object({ type: z.literal('backToLobby') }),
]);

/** Drops keys whose value is undefined, as `exactOptionalPropertyTypes` requires. */
function defined<T extends object>(value: T): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as {
    [K in keyof T]: Exclude<T[K], undefined>;
  };
}

export type ParseResult =
  | { readonly ok: true; readonly message: ClientMessage }
  | { readonly ok: false; readonly error: { readonly code: 'INVALID_MESSAGE' } };

const invalid: ParseResult = { ok: false, error: { code: 'INVALID_MESSAGE' } };

/** Validates a message received from a client: a JSON string or an already parsed value. */
export function parseClientMessage(raw: unknown): ParseResult {
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return invalid;
    }
  }
  const parsed = message.safeParse(value);
  if (!parsed.success) return invalid;
  const m = parsed.data;
  switch (m.type) {
    case 'join':
    case 'configure':
      return {
        ok: true,
        message: m.type === 'join' ? defined(m) : { ...m, options: defined(m.options) },
      };
    case 'action':
      return { ok: true, message: { type: 'action', action: defined(m.action) as Action } };
    default:
      return { ok: true, message: m };
  }
}
