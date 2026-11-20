import type { PlayerCount } from '@tarot/engine';

/** Bot levels a host may seat: Facile, Moyen, Difficile. */
export const BOT_LEVELS = ['easy', 'medium', 'hard'] as const;
export type SeatBotLevel = (typeof BOT_LEVELS)[number];

export const BOT_SPEEDS = ['fast', 'normal', 'slow'] as const;
export type BotSpeed = (typeof BOT_SPEEDS)[number];

/** Room options set by the host before a session starts (AGENTS.md §5). */
export interface RoomOptions {
  readonly players: PlayerCount;
  /** Number of played deals in a session. */
  readonly deals: number;
  readonly chelemAnnouncements: boolean;
  readonly botSpeed: BotSpeed;
}

export const DEFAULT_ROOM_OPTIONS: RoomOptions = {
  players: 4,
  deals: 8,
  chelemAnnouncements: true,
  botSpeed: 'normal',
};

export const MAX_DEALS = 99;
export const MAX_NICKNAME_LENGTH = 20;
/** Longest code a client may send (the host's code, AGENTS.md §5). */
export const MAX_CODE_LENGTH = 200;
