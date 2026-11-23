import type { ClientMessage, RoomView, ServerMessage } from '@tarot/protocol';
import {
  applyRoomCommand,
  createRoom,
  type RoomCommand,
  type RoomEffect,
  type RoomState,
} from '../room';

/** Drives a room as the server would, with a fake clock and predictable tokens and seeds. */
export class RoomHarness {
  room: RoomState;
  now = 0;
  private counter = 0;
  /** Messages received by each connection, in order. */
  readonly inbox = new Map<string, ServerMessage[]>();
  readonly closed = new Set<string>();
  wakeAt: number | null = null;
  destroyed = false;
  /** The host code, as the HOST_CODE secret would supply it. */
  hostCode: string | undefined = undefined;
  /** Whether the last command asked for the room to be saved. */
  lastPersist = true;

  constructor(code = 'ABCDEF') {
    this.room = createRoom(code, this.now);
  }

  run(command: RoomCommand): readonly RoomEffect[] {
    this.counter++;
    const env = {
      now: this.now,
      seed: this.counter * 7919,
      token: `token-${this.counter}`,
      hostCode: this.hostCode,
    };
    const { room, effects, persist } = applyRoomCommand(this.room, command, env);
    this.room = room;
    this.lastPersist = persist;
    for (const effect of effects) {
      if (effect.type === 'send') {
        const box = this.inbox.get(effect.connection) ?? [];
        box.push(effect.message);
        this.inbox.set(effect.connection, box);
      } else if (effect.type === 'close') this.closed.add(effect.connection);
      else if (effect.type === 'wakeAt') this.wakeAt = effect.at;
      else this.destroyed = true;
    }
    return effects;
  }

  send(connection: string, message: ClientMessage): readonly RoomEffect[] {
    return this.run({ type: 'message', connection, message });
  }

  join(connection: string, nickname: string, token?: string): string | null {
    this.send(connection, { type: 'join', nickname, ...(token ? { token } : {}) });
    const welcome = [...this.messages(connection)].reverse().find((m) => m.type === 'welcome');
    return welcome?.type === 'welcome' ? welcome.token : null;
  }

  disconnect(connection: string): readonly RoomEffect[] {
    return this.run({ type: 'disconnect', connection });
  }

  /** Advances the clock, waking the room whenever it asked to be woken. */
  advance(ms: number): void {
    const target = this.now + ms;
    while (this.wakeAt !== null && this.wakeAt <= target && !this.destroyed) {
      this.now = Math.max(this.now, this.wakeAt);
      this.wakeAt = null;
      this.run({ type: 'wake' });
    }
    this.now = target;
  }

  messages(connection: string): ServerMessage[] {
    return this.inbox.get(connection) ?? [];
  }

  view(connection: string): RoomView {
    const state = [...this.messages(connection)].reverse().find((m) => m.type === 'state');
    if (state?.type !== 'state') throw new Error(`${connection} received no state`);
    return state.view;
  }

  lastError(connection: string): string | null {
    const last = this.messages(connection).at(-1);
    return last?.type === 'error' ? last.code : null;
  }
}
