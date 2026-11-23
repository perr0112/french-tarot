import { canCatchUp, createBot, emptyMemory, memoryFromTricks, type BotMemory } from '@tarot/bots';
import {
  applyAction,
  applySessionAction,
  createRng,
  createSession,
  getLegalActions,
  getPlayerView,
  type Action,
  type DealState,
  type LegalAction,
  type Seat,
  type SessionState,
} from '@tarot/engine';
import {
  DEFAULT_ROOM_OPTIONS,
  type BotSpeed,
  type ClientMessage,
  type RoomOptions,
  type RoomPhase,
  type RoomView,
  type SeatBotLevel,
  type SeatOccupant,
  type ServerErrorCode,
  type ServerMessage,
  CHIEN_PAUSE_MS,
  REACTION_INTERVAL_MS,
  TRICK_PAUSE_MS,
  type Reaction,
} from '@tarot/protocol';

export { CHIEN_PAUSE_MS, TRICK_PAUSE_MS };

/** Delay before each bot move, by room option (AGENTS.md §5). */
export const BOT_DELAY_MS: Readonly<Record<BotSpeed, number>> = {
  fast: 300,
  normal: 800,
  slow: 1500,
};
/** How long a disconnected player keeps their seat before a bot plays it. */
export const REPLACE_AFTER_MS = 10_000;
/** A room nobody is connected to is deleted after this long without activity. */
export const EXPIRE_AFTER_MS = 24 * 60 * 60 * 1000;
/** Wrong host codes a participant may send before every code is refused. */
export const MAX_CODE_TRIES = 5;
/** With nobody to wait for (every player on autoplay), how long a deal's result stays shown. */
export const AUTO_NEXT_DEAL_MS = 6000;
/** Level of the bot that plays for a disconnected player, or for one who left. */
const REPLACEMENT_LEVEL: SeatBotLevel = 'medium';
/** The bot playing for a player who turned autoplay on: random legal cards (AGENTS.md §5). */
const AUTOPLAY_LEVEL: SeatBotLevel = 'easy';

export interface Participant {
  /** Secret that lets this participant reconnect; only ever sent to them. */
  readonly token: string;
  readonly nickname: string;
  readonly seat: Seat | null;
  /** The socket connection currently attached, or null while disconnected. */
  readonly connection: string | null;
  readonly disconnectedAt: number | null;
  /** Wrong host codes sent so far (absent in old rooms); past MAX_CODE_TRIES, all are refused. */
  readonly codeTries?: number;
  /** A bot (AUTOPLAY_LEVEL) plays every decision of the seat; absent in old rooms. */
  readonly autoplay?: boolean;
  /** When this player last reacted (REACTION_INTERVAL_MS between two); absent if never. */
  readonly reactedAt?: number;
}

/** The whole state of a room: plain JSON, persisted after every command. */
export interface RoomState {
  readonly code: string;
  readonly phase: RoomPhase;
  readonly options: RoomOptions;
  /** In join order, which decides the host and who gets a freed seat first. */
  readonly participants: readonly Participant[];
  /** Bot level of each seat, or null for a human or empty seat. */
  readonly bots: readonly (SeatBotLevel | null)[];
  /** Number of each seat's bot (« Jade 2 »), kept while it sits there; absent in old rooms. */
  readonly botNumbers?: readonly (number | null)[];
  readonly session: SessionState | null;
  /** The deal in play, or the last one once it is over (the session drops finished deals). */
  readonly currentDeal: DealState | null;
  /** Memory of whichever bot plays each seat. */
  readonly memories: readonly BotMemory[];
  /** Between two deals: seats whose players asked for the next deal. */
  readonly continued: readonly Seat[];
  /** When the seat to act may act at the earliest (later after a completed trick). */
  readonly turnSince: number;
  /** The seat the next deal gives an exceptional hand (the host code); absent in old rooms. */
  readonly favoured?: Seat | null;
  readonly lastActivity: number;
}

export type RoomCommand =
  | { readonly type: 'message'; readonly connection: string; readonly message: ClientMessage }
  | { readonly type: 'disconnect'; readonly connection: string }
  /** The alarm the room asked for went off. */
  | { readonly type: 'wake' };

/** What the server supplies with each command, so the room stays deterministic. */
export interface RoomEnv {
  readonly now: number;
  /** Fresh random seed (deals, bot decisions). */
  readonly seed: number;
  /** Fresh random token, used if a new participant joins. */
  readonly token: string;
  /** The host code (the HOST_CODE Cloudflare secret); unset, codes are always refused. */
  readonly hostCode?: string | undefined;
}

export type RoomEffect =
  | { readonly type: 'send'; readonly connection: string; readonly message: ServerMessage }
  | { readonly type: 'close'; readonly connection: string }
  /** Replaces any previous alarm. */
  | { readonly type: 'wakeAt'; readonly at: number }
  /** The room has expired: delete its storage. */
  | { readonly type: 'destroy' };

export interface RoomResult {
  readonly room: RoomState;
  readonly effects: readonly RoomEffect[];
}

export function createRoom(code: string, now: number): RoomState {
  return {
    code,
    phase: 'lobby',
    options: DEFAULT_ROOM_OPTIONS,
    participants: [],
    bots: Array.from({ length: DEFAULT_ROOM_OPTIONS.players }, () => null),
    session: null,
    currentDeal: null,
    memories: [],
    continued: [],
    turnSince: now,
    lastActivity: now,
  };
}

/** Outcome of handling one command, before views are broadcast. */
interface Outcome {
  readonly room: RoomState | 'destroy';
  /** Direct replies (welcome, errors, closes), sent before the new views. */
  readonly replies: readonly RoomEffect[];
  /** Nothing anyone can see changed: no views are sent (the host code tells nobody else). */
  readonly quiet?: boolean;
}

const reply = (connection: string, message: ServerMessage): RoomEffect => ({
  type: 'send',
  connection,
  message,
});
const refuse = (room: RoomState, connection: string, code: ServerErrorCode): Outcome => ({
  room,
  replies: [reply(connection, { type: 'error', code })],
});

/** Applies one command; never throws on bad input, which only earns its sender an error. */
export function applyRoomCommand(room: RoomState, command: RoomCommand, env: RoomEnv): RoomResult {
  const outcome = handle(room, command, env);
  if (outcome.room === 'destroy') return { room, effects: [{ type: 'destroy' }] };
  let next = outcome.room;
  const changed = (next !== room && !outcome.quiet) || command.type === 'wake';
  if (next !== room && command.type !== 'wake') next = { ...next, lastActivity: env.now };
  const effects: RoomEffect[] = [...outcome.replies];
  if (changed) effects.push(...broadcast(next, env.now));
  const wake = nextWake(next, env.now);
  if (wake !== null) effects.push({ type: 'wakeAt', at: wake });
  return { room: next, effects };
}

function handle(room: RoomState, command: RoomCommand, env: RoomEnv): Outcome {
  switch (command.type) {
    case 'disconnect':
      return { room: disconnect(room, command.connection, env.now, env), replies: [] };
    case 'wake':
      return wake(room, env);
    case 'message':
      return handleMessage(room, command.connection, command.message, env);
  }
}

function handleMessage(
  room: RoomState,
  connection: string,
  message: ClientMessage,
  env: RoomEnv,
): Outcome {
  if (message.type === 'join') return join(room, connection, message, env);
  const me = byConnection(room, connection);
  if (!me) return refuse(room, connection, 'NOT_JOINED');
  const done = (next: RoomState | ServerErrorCode): Outcome =>
    typeof next === 'string' ? refuse(room, connection, next) : { room: next, replies: [] };

  switch (message.type) {
    case 'configure':
      return done(asHostIn(room, me, 'lobby') ?? configure(room, message.options));
    case 'setBot':
      return done(asHostIn(room, me, 'lobby') ?? setBot(room, message.seat, message.level));
    case 'start':
      return done(asHostIn(room, me, 'lobby') ?? start(room, env));
    case 'newSession':
      return done(
        asHostIn(room, me, 'finished') ??
          (seatsOf(room).some((seat) => isFree(room, seat))
            ? 'SEATS_NOT_FILLED'
            : beginSession(room, room.session?.dealer ?? 0, env)),
      );
    case 'backToLobby':
      return done(
        asHostIn(room, me, 'finished') ?? {
          ...endAutoplay(room),
          phase: 'lobby',
          session: null,
          currentDeal: null,
          continued: [],
          favoured: null,
        },
      );
    case 'action':
      if (me.seat === null) return done('NOT_SEATED');
      if (room.phase !== 'playing') return done('WRONG_ROOM_PHASE');
      return done(humanPlay(room, me.seat, message.action, env.now));
    case 'continue':
      if (me.seat === null) return done('NOT_SEATED');
      return done(continueToNextDeal(room, me.seat, env));
    case 'leave':
      return { room: leave(room, me, env), replies: [{ type: 'close', connection }] };
    case 'code':
      return hostCode(room, me, connection, message.code, env);
    case 'react':
      return react(room, me, message.emoji, env);
    case 'autoplay':
      if (me.seat === null) return done('NOT_SEATED');
      return done(setAutoplay(room, me, message.on, env));
    case 'abandonDeal':
      return done(abandonDeal(room, me, env));
  }
}

// ---------------------------------------------------------------- participants and lobby

function isHost(room: RoomState, participant: Participant): boolean {
  return room.participants.find((p) => p.connection !== null) === participant;
}

/** Null when `me` is the host and the room is in `phase`; otherwise the error. */
function asHostIn(room: RoomState, me: Participant, phase: RoomPhase): ServerErrorCode | null {
  if (!isHost(room, me)) return 'NOT_HOST';
  return room.phase === phase ? null : 'WRONG_ROOM_PHASE';
}

const humanAt = (room: RoomState, seat: Seat) => room.participants.find((p) => p.seat === seat);
const byConnection = (room: RoomState, connection: string) =>
  room.participants.find((p) => p.connection === connection);
const seatsOf = (room: RoomState): Seat[] =>
  Array.from({ length: room.options.players }, (_, seat) => seat);
/** When a bot takes the seat of a disconnected participant, or null while connected. */
const replacedFrom = (p: Participant) =>
  p.disconnectedAt === null ? null : p.disconnectedAt + REPLACE_AFTER_MS;

const replace = (room: RoomState, from: Participant, to: Participant): RoomState => ({
  ...room,
  participants: room.participants.map((p) => (p === from ? to : p)),
});

function join(
  room: RoomState,
  connection: string,
  message: Extract<ClientMessage, { type: 'join' }>,
  env: RoomEnv,
): Outcome {
  if (byConnection(room, connection)) return refuse(room, connection, 'ALREADY_JOINED');
  const known = room.participants.find((p) => p.token === message.token);
  if (known) {
    const replies: RoomEffect[] = [];
    if (known.connection !== null) {
      replies.push(reply(known.connection, { type: 'error', code: 'REPLACED_BY_NEW_CONNECTION' }), {
        type: 'close',
        connection: known.connection,
      });
    }
    replies.push(reply(connection, { type: 'welcome', token: known.token }));
    const back = replace(room, known, { ...known, connection, disconnectedAt: null });
    return { room: room.phase === 'lobby' ? fillSeats(back) : back, replies };
  }

  if (room.phase !== 'lobby') {
    return {
      room,
      replies: [
        reply(connection, { type: 'error', code: 'SESSION_IN_PROGRESS' }),
        { type: 'close', connection },
      ],
    };
  }
  const nickname = message.nickname.toLocaleLowerCase('fr');
  if (room.participants.some((p) => p.nickname.toLocaleLowerCase('fr') === nickname)) {
    return refuse(room, connection, 'NICKNAME_TAKEN');
  }
  const newcomer: Participant = {
    token: env.token,
    nickname: message.nickname,
    seat: null,
    connection,
    disconnectedAt: null,
  };
  return {
    room: fillSeats({ ...room, participants: [...room.participants, newcomer] }),
    replies: [reply(connection, { type: 'welcome', token: env.token })],
  };
}

function disconnect(room: RoomState, connection: string, now: number, env: RoomEnv): RoomState {
  const leaving = byConnection(room, connection);
  if (!leaving) return room;
  if (room.phase === 'lobby') {
    // Nothing to protect before the start: the seat goes to whoever waits; the token stays valid.
    const gone = { ...leaving, seat: null, connection: null, disconnectedAt: now };
    return fillSeats(replace(room, leaving, gone));
  }
  const next = replace(room, leaving, { ...leaving, connection: null, disconnectedAt: now });
  // The deal may only have been waiting for this player to continue.
  return room.session?.phase === 'waitingForDeal' ? dealIfAllContinued(next, env) : next;
}

/**
 * A participant leaves for good (AGENTS.md §5): forgotten, token and all. During a session a
 * bot plays their seat from now on; otherwise (lobby, session over) the seat is freed for
 * whoever waits, and must be filled before a new session.
 */
function leave(room: RoomState, leaving: Participant, env: RoomEnv): RoomState {
  const participants = room.participants.filter((p) => p !== leaving);
  const seat = leaving.seat;
  // A host code was for the player, not for the bot taking the seat.
  if (seat !== null && room.favoured === seat) room = { ...room, favoured: null };
  if (room.phase !== 'playing' || seat === null) return fillSeats({ ...room, participants });
  const next = withBots(
    { ...room, participants },
    room.bots.map((b, s) => (s === seat ? REPLACEMENT_LEVEL : b)),
  );
  // The deal may only have been waiting for this player to continue.
  return room.session?.phase === 'waitingForDeal' ? dealIfAllContinued(next, env) : next;
}

const isFree = (room: RoomState, seat: Seat) =>
  room.bots[seat] === null && humanAt(room, seat) === undefined;

/** Gives free seats to connected participants without one, in join order. */
function fillSeats(room: RoomState): RoomState {
  let next = room;
  for (const participant of room.participants) {
    if (participant.seat !== null || participant.connection === null) continue;
    const seat = seatsOf(next).find((s) => isFree(next, s));
    if (seat === undefined) break;
    const current = next.participants.find((p) => p.token === participant.token) as Participant;
    next = replace(next, current, { ...current, seat });
  }
  return next;
}

function configure(room: RoomState, patch: Partial<RoomOptions>): RoomState {
  const options = { ...room.options, ...patch };
  const players = options.players;
  return fillSeats(
    withBots(
      {
        ...room,
        options,
        participants: room.participants.map((p) =>
          p.seat !== null && p.seat >= players ? { ...p, seat: null } : p,
        ),
      },
      Array.from({ length: players }, (_, seat) => room.bots[seat] ?? null),
    ),
  );
}

function setBot(
  room: RoomState,
  seat: Seat,
  level: SeatBotLevel | null,
): RoomState | ServerErrorCode {
  if (seat >= room.options.players) return 'SEAT_INVALID';
  if (humanAt(room, seat)) return 'SEAT_TAKEN';
  return fillSeats(
    withBots(
      room,
      room.bots.map((b, s) => (s === seat ? level : b)),
    ),
  );
}

/** The bots' numbers: as stored, or (old rooms) in seat order. */
function botNumbersOf(room: RoomState): (number | null)[] {
  if (room.botNumbers) return [...room.botNumbers];
  let count = 0;
  return room.bots.map((bot) => (bot === null ? null : ++count));
}

/**
 * Seats `bots`: a bot that stays keeps its number, even with a new level; a new one takes the
 * smallest number free, so no bot is renamed when another comes or goes (Jade 1, Jade 2…).
 */
function withBots(room: RoomState, bots: readonly (SeatBotLevel | null)[]): RoomState {
  const before = botNumbersOf(room);
  const numbers = bots.map((bot, seat) => (bot === null ? null : (before[seat] ?? null)));
  bots.forEach((bot, seat) => {
    if (bot === null || numbers[seat] !== null) return;
    let free = 1;
    while (numbers.includes(free)) free++;
    numbers[seat] = free;
  });
  return { ...room, bots, botNumbers: numbers };
}

// ---------------------------------------------------------------- session and deals

function start(room: RoomState, env: RoomEnv): RoomState | ServerErrorCode {
  if (seatsOf(room).some((seat) => isFree(room, seat))) return 'SEATS_NOT_FILLED';
  // A first dealer drawn independently of the deal's own shuffle.
  const dealer = Math.floor(createRng(env.seed ^ 0x9e3779b9)() * room.options.players);
  return beginSession(room, dealer, env);
}

function beginSession(room: RoomState, dealer: Seat, env: RoomEnv): RoomState {
  const { players, deals, chelemAnnouncements } = room.options;
  const session = createSession({ players, deals, dealer, options: { chelemAnnouncements } });
  // A host code is for the session it was typed in.
  return dealNext(endAutoplay({ ...room, phase: 'playing', session, favoured: null }), env);
}

/**
 * The host code (AGENTS.md §5): the sender's seat gets an exceptional hand in the next deal of
 * this session. Answered to the sender only, the same way whatever was wrong, and nobody else
 * hears of it; past MAX_CODE_TRIES wrong codes, every code is refused.
 */
function hostCode(
  room: RoomState,
  me: Participant,
  connection: string,
  code: string,
  env: RoomEnv,
): Outcome {
  const session = room.session;
  const tries = me.codeTries ?? 0;
  const nextDealComing =
    room.phase === 'playing' && session !== null && session.played + 1 < session.deals;
  const right = env.hostCode !== undefined && env.hostCode !== '' && sameSecret(code, env.hostCode);
  const accepted = right && tries < MAX_CODE_TRIES && nextDealComing && me.seat !== null;
  const counted = right ? room : replace(room, me, { ...me, codeTries: tries + 1 });
  return {
    room: accepted ? { ...counted, favoured: me.seat } : counted,
    replies: [reply(connection, { type: 'code', accepted })],
    quiet: true,
  };
}

/** Compares a code with the secret in a time that does not depend on where they differ. */
export function sameSecret(given: string, secret: string): boolean {
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(secret);
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

function dealNext(room: RoomState, env: RoomEnv): RoomState {
  if (room.session === null) return room;
  const favoured = room.favoured ?? null;
  const result = applySessionAction(room.session, {
    type: 'deal',
    seed: env.seed,
    ...(favoured !== null ? { favoured } : {}),
  });
  if (!result.ok) return room;
  return {
    ...room,
    session: result.session,
    currentDeal: result.session.deal,
    memories: Array.from({ length: room.options.players }, emptyMemory),
    continued: [],
    turnSince: env.now,
    // Used once: the code has to be typed again for another one.
    favoured: null,
  };
}

/** Plays one engine action for `seat`, by a human or a bot. */
function play(
  room: RoomState,
  seat: Seat,
  action: Action,
  now: number,
): RoomState | ServerErrorCode {
  const deal = room.session?.deal;
  if (!room.session || !deal) return 'NO_DEAL_IN_PROGRESS';
  // Applied to the deal too, because the session drops a deal once it is over and the room
  // keeps showing it (last trick, breakdown).
  const dealResult = applyAction(deal, seat, action);
  if (!dealResult.ok) return dealResult.error.code;
  const sessionResult = applySessionAction(room.session, { type: 'play', seat, action });
  if (!sessionResult.ok) return sessionResult.error.code;
  const after = dealResult.state;
  const over = sessionResult.session.phase === 'finished';
  const trickDone = after.tricks.length > deal.tricks.length;
  const chienShown = after.phase === 'ecart' && deal.phase !== 'ecart';
  // Everyone sees a completed trick, or the chien turned over, before the next move.
  const pauseAfter = trickDone ? TRICK_PAUSE_MS : chienShown ? CHIEN_PAUSE_MS : 0;
  return {
    ...(over ? endAutoplay(room) : room),
    phase: over ? 'finished' : 'playing',
    session: sessionResult.session,
    currentDeal: after,
    turnSince: now + pauseAfter,
  };
}

/**
 * A human move. It also clears the seat's bot memory, so a bot standing in later in the deal
 * is rebuilt from the tricks instead of trusting what it saw before the player came back.
 */
function humanPlay(room: RoomState, seat: Seat, action: Action, now: number) {
  const next = play(room, seat, action, now);
  if (typeof next === 'string') return next;
  return { ...next, memories: next.memories.map((m, s) => (s === seat ? emptyMemory() : m)) };
}

/** Seats whose players must ask for the next deal before it is dealt: connected, not on autoplay. */
const connectedSeats = (room: RoomState) =>
  room.participants.flatMap((p) =>
    p.seat !== null && p.connection !== null && p.autoplay !== true ? [p.seat] : [],
  );

function setAutoplay(
  room: RoomState,
  me: Participant,
  on: boolean,
  env: RoomEnv,
): RoomState | ServerErrorCode {
  // For the session in play only: it ends with it (endAutoplay).
  if (room.phase !== 'playing') return 'WRONG_ROOM_PHASE';
  const next = replace(room, me, { ...me, autoplay: on });
  // The next deal may only have been waiting for this player to continue.
  return on && next.phase === 'playing' && next.session?.phase === 'waitingForDeal'
    ? dealIfAllContinued(next, env)
    : next;
}

/**
 * A reaction (AGENTS.md §6): sent at once to everyone connected, with the seat, and kept
 * nowhere. One every REACTION_INTERVAL_MS per player; one sent sooner is dropped, quietly.
 */
function react(room: RoomState, me: Participant, emoji: Reaction, env: RoomEnv): Outcome {
  if (room.phase !== 'playing' || me.seat === null) {
    return refuse(room, me.connection ?? '', 'WRONG_ROOM_PHASE');
  }
  if (me.reactedAt !== undefined && env.now - me.reactedAt < REACTION_INTERVAL_MS) {
    return { room, replies: [], quiet: true };
  }
  const seat = me.seat;
  return {
    room: replace(room, me, { ...me, reactedAt: env.now }),
    replies: room.participants.flatMap((p) =>
      p.connection === null ? [] : [reply(p.connection, { type: 'reaction', seat, emoji })],
    ),
    quiet: true,
  };
}

/** Whether `me` may abandon the deal: seated, alone with bots, a deal in progress. */
function mayAbandonDeal(room: RoomState, me: Participant): boolean {
  return (
    room.phase === 'playing' &&
    room.session?.deal != null &&
    me.seat !== null &&
    room.participants.filter((p) => p.seat !== null).length === 1
  );
}

/** Autoplay is for one session: off when it ends or a new one begins. */
const endAutoplay = (room: RoomState): RoomState => ({
  ...room,
  participants: room.participants.map((p) => (p.autoplay ? { ...p, autoplay: false } : p)),
});

/**
 * « Redonner »: a player alone with bots drops the deal in progress for a new one from the same
 * dealer, recorded nowhere (AGENTS.md §5). Never with another player at the table.
 */
function abandonDeal(room: RoomState, me: Participant, env: RoomEnv): RoomState | ServerErrorCode {
  if (!room.session || !mayAbandonDeal(room, me)) return 'ABANDON_NOT_ALLOWED';
  const result = applySessionAction(room.session, { type: 'abandon', seed: env.seed });
  if (!result.ok) return result.error.code;
  return {
    ...room,
    session: result.session,
    // As dealNext: null when a petit sec cancels the new deal at once (it is then recorded).
    currentDeal: result.session.deal,
    memories: Array.from({ length: room.options.players }, emptyMemory),
    turnSince: env.now,
  };
}

function continueToNextDeal(
  room: RoomState,
  seat: Seat,
  env: RoomEnv,
): RoomState | ServerErrorCode {
  if (room.phase !== 'playing' || room.session?.phase !== 'waitingForDeal') {
    return 'WRONG_ROOM_PHASE';
  }
  const continued = room.continued.includes(seat) ? room.continued : [...room.continued, seat];
  return dealIfAllContinued({ ...room, continued }, env);
}

function dealIfAllContinued(room: RoomState, env: RoomEnv): RoomState {
  return nobodyAwaited(room) && !isPaused(room) ? dealNext(room, env) : room;
}

const nobodyAwaited = (room: RoomState) =>
  connectedSeats(room).every((s) => room.continued.includes(s));

/**
 * When the next deal comes by itself: a deal just over with nobody to ask for the next one
 * (every player on autoplay), once its result has been shown a while.
 */
function autoDealAt(room: RoomState): number | null {
  return room.phase === 'playing' &&
    room.session?.phase === 'waitingForDeal' &&
    !isPaused(room) &&
    nobodyAwaited(room)
    ? room.turnSince + AUTO_NEXT_DEAL_MS
    : null;
}

// ---------------------------------------------------------------- bots and timing

type Controller =
  | { readonly kind: 'human' }
  /** A disconnected player whose seat a bot will take at `from`. */
  | { readonly kind: 'absent'; readonly from: number }
  | { readonly kind: 'bot'; readonly level: SeatBotLevel; readonly since: number };

function controllerOf(room: RoomState, seat: Seat, now: number): Controller {
  const level = room.bots[seat];
  if (level) return { kind: 'bot', level, since: -Infinity };
  const human = humanAt(room, seat);
  if (human?.autoplay === true) return { kind: 'bot', level: AUTOPLAY_LEVEL, since: -Infinity };
  const from = human ? replacedFrom(human) : null;
  if (from === null) return { kind: 'human' };
  return now >= from
    ? { kind: 'bot', level: REPLACEMENT_LEVEL, since: from }
    : { kind: 'absent', from };
}

/** With nobody connected the room pauses: bots do not play to an empty table. */
const isPaused = (room: RoomState) => room.participants.every((p) => p.connection === null);

interface BotTurn {
  readonly deal: DealState;
  readonly seat: Seat;
  readonly level: SeatBotLevel;
  readonly dueAt: number;
}

/** The bot whose turn it is and when it will play, or null if it is not a bot's turn. */
function botTurn(room: RoomState, now: number): BotTurn | null {
  const deal = room.session?.deal;
  const seat = deal?.turn;
  if (room.phase !== 'playing' || isPaused(room) || !deal || seat === undefined || seat === null) {
    return null;
  }
  const controller = controllerOf(room, seat, now);
  if (controller.kind !== 'bot') return null;
  const dueAt = Math.max(room.turnSince, controller.since) + BOT_DELAY_MS[room.options.botSpeed];
  return { deal, seat, level: controller.level, dueAt };
}

function nextWake(room: RoomState, now: number): number | null {
  const times: number[] = [];
  const turn = botTurn(room, now);
  if (turn !== null) times.push(turn.dueAt);
  const autoDeal = autoDealAt(room);
  if (autoDeal !== null) times.push(autoDeal);
  if (room.phase === 'playing' && !isPaused(room)) {
    for (const p of room.participants) {
      const from = replacedFrom(p);
      if (p.seat !== null && from !== null && from > now) times.push(from);
    }
  }
  if (isPaused(room)) times.push(room.lastActivity + EXPIRE_AFTER_MS);
  return times.length > 0 ? Math.max(now, Math.min(...times)) : null;
}

/**
 * A bot keeps its own memory from turn to turn. One that missed tricks (it stands in for a
 * player mid-deal) is given them: every seat saw them, so they are public.
 */
function standInMemory(deal: DealState, memory: BotMemory): BotMemory {
  return deal.phase === 'playing' && !canCatchUp(memory, deal.tricks.length)
    ? memoryFromTricks(deal.players, deal.tricks, deal.currentTrick)
    : memory;
}

function wake(room: RoomState, env: RoomEnv): Outcome {
  if (isPaused(room) && env.now >= room.lastActivity + EXPIRE_AFTER_MS) {
    return { room: 'destroy', replies: [] };
  }
  const autoDeal = autoDealAt(room);
  if (autoDeal !== null && autoDeal <= env.now) return { room: dealNext(room, env), replies: [] };
  const turn = botTurn(room, env.now);
  if (turn === null || turn.dueAt > env.now) return { room, replies: [] };
  const { deal, seat, level } = turn;
  const memory = standInMemory(deal, room.memories[seat] ?? emptyMemory());
  const decision = createBot(level).decide(getPlayerView(deal, seat), memory, createRng(env.seed));
  let next = play(room, seat, decision.action, env.now);
  if (typeof next === 'string') {
    // Should never happen; a refused bot action must not freeze the table.
    const [template] = getLegalActions(deal, seat);
    next = template ? play(room, seat, simpleAction(template), env.now) : next;
    if (typeof next === 'string') return { room, replies: [] };
  }
  const played = next;
  return {
    room: {
      ...played,
      memories: played.memories.map((m, s) => (s === seat ? decision.memory : m)),
    },
    replies: [],
  };
}

/** A legal action anyone may take from a template: pass, the first card, no announcement. */
function simpleAction(template: LegalAction): Action {
  switch (template.type) {
    case 'bid':
      return { type: 'bid', contract: template.choices.includes('pass') ? 'pass' : 'petite' };
    case 'callKing':
      return { type: 'callKing', card: template.cards[0] ?? 'S14' };
    case 'ecart':
      // Eligible cards are sorted: suit cards come before any trump.
      return { type: 'ecart', cards: template.eligible.slice(0, template.count) };
    case 'decideChelem':
      return { type: 'decideChelem', announce: false };
    case 'playCard':
      return { type: 'playCard', card: template.cards[0] ?? 'EXC' };
  }
}

// ---------------------------------------------------------------- views

function occupantOf(room: RoomState, seat: Seat, now: number): SeatOccupant {
  const level = room.bots[seat];
  if (level) return { kind: 'bot', level, number: botNumbersOf(room)[seat] ?? seat + 1 };
  const human = humanAt(room, seat);
  if (!human) return { kind: 'empty' };
  return {
    kind: 'human',
    nickname: human.nickname,
    connected: human.connection !== null,
    replacedByBot:
      room.phase === 'playing' &&
      human.autoplay !== true &&
      controllerOf(room, seat, now).kind === 'bot',
    autoplay: human.autoplay === true,
  };
}

/** The snapshot one participant may see: never another hand, never another token. */
export function roomViewFor(room: RoomState, token: string, now: number): RoomView | null {
  const me = room.participants.find((p) => p.token === token);
  if (!me) return null;
  const session = room.session;
  return {
    code: room.code,
    phase: room.phase,
    options: room.options,
    you: { nickname: me.nickname, seat: me.seat, isHost: isHost(room, me) },
    seats: seatsOf(room).map((seat) => occupantOf(room, seat, now)),
    waiting: room.participants
      .filter((p) => p.seat === null && p.connection !== null)
      .map((p) => p.nickname),
    session: session && {
      deals: session.deals,
      played: session.played,
      dealer: session.dealer,
      totals: session.totals,
      history: session.history,
      continued: session.phase === 'waitingForDeal' ? room.continued : null,
    },
    deal: me.seat !== null && room.currentDeal ? getPlayerView(room.currentDeal, me.seat) : null,
    canAbandonDeal: mayAbandonDeal(room, me),
  };
}

function broadcast(room: RoomState, now: number): RoomEffect[] {
  return room.participants.flatMap((p) => {
    const view = roomViewFor(room, p.token, now);
    return p.connection !== null && view ? [reply(p.connection, { type: 'state', view })] : [];
  });
}
