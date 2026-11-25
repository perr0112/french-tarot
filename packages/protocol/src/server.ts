import type {
  ErrorCode,
  PlayerView,
  Seat,
  SessionDealRecord,
  SessionErrorCode,
} from '@tarot/engine';
import type { Reaction, RoomOptions, SeatBotLevel, ThrowItem } from './options';

export type RoomPhase = 'lobby' | 'playing' | 'finished';

export type RoomErrorCode =
  | 'INVALID_MESSAGE'
  | 'NOT_JOINED'
  | 'ALREADY_JOINED'
  | 'NICKNAME_TAKEN'
  | 'SESSION_IN_PROGRESS'
  | 'NOT_HOST'
  | 'WRONG_ROOM_PHASE'
  | 'SEAT_INVALID'
  | 'SEAT_TAKEN'
  | 'SEATS_NOT_FILLED'
  | 'NOT_SEATED'
  | 'ABANDON_NOT_ALLOWED'
  | 'REPLACED_BY_NEW_CONNECTION';

/** Every error a client may receive: room, session or engine rules. */
export type ServerErrorCode = RoomErrorCode | SessionErrorCode | ErrorCode;

export type SeatOccupant =
  | {
      readonly kind: 'human';
      readonly nickname: string;
      readonly connected: boolean;
      /** A bot plays this seat until its player comes back ("remplacé par un bot"). */
      readonly replacedByBot: boolean;
      /** The player let a bot play for them (« jeu auto »). */
      readonly autoplay: boolean;
      /** The player's name scrambles like a hacker's (`tarot.hacker()` in the console). */
      readonly hacker: boolean;
    }
  /** `number`: the bot's own number (« Jade 2 »), kept as long as it sits at this seat. */
  | { readonly kind: 'bot'; readonly level: SeatBotLevel; readonly number: number }
  | { readonly kind: 'empty' };

export interface SessionView {
  readonly deals: number;
  readonly played: number;
  readonly dealer: Seat;
  readonly totals: readonly number[];
  readonly history: readonly SessionDealRecord[];
  /** Between two deals: the seats whose players asked for the next one. */
  readonly continued: readonly Seat[] | null;
}

/** Everything one participant may see of the room: its own redacted snapshot. */
export interface RoomView {
  readonly code: string;
  readonly phase: RoomPhase;
  readonly options: RoomOptions;
  readonly you: { readonly nickname: string; readonly seat: Seat | null; readonly isHost: boolean };
  readonly seats: readonly SeatOccupant[];
  /** Participants without a seat (more humans than seats). */
  readonly waiting: readonly string[];
  readonly session: SessionView | null;
  /** The current deal, or the last one once it is over, from this seat's point of view. */
  readonly deal: PlayerView | null;
  /** This player may drop the deal in progress for a new one (« Redonner », AGENTS.md §5). */
  readonly canAbandonDeal: boolean;
  /** Once the session is over: the seats whose players accepted to play again; else null. */
  readonly replayReady: readonly Seat[] | null;
}

/** Messages the room sends to a client. */
export type ServerMessage =
  | { readonly type: 'welcome'; readonly token: string }
  | { readonly type: 'state'; readonly view: RoomView }
  | { readonly type: 'error'; readonly code: ServerErrorCode }
  /** To everyone at the table: a player threw something at another (kept nowhere). */
  | { readonly type: 'throw'; readonly from: Seat; readonly to: Seat; readonly item: ThrowItem }
  /** To everyone at the table: a player reacted (shown at their seat, kept nowhere). */
  | { readonly type: 'reaction'; readonly seat: Seat; readonly emoji: Reaction }
  /** Only to the sender of a code: whether it armed the next deal. */
  | { readonly type: 'code'; readonly accepted: boolean };
