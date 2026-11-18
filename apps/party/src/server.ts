import { parseClientMessage, type ServerMessage } from '@tarot/protocol';
import { Server, routePartykitRequest, type Connection } from 'partyserver';
import { isAllowedOrigin } from './origin';
import { applyRoomCommand, createRoom, type RoomCommand, type RoomState } from './room';

interface Env extends Cloudflare.Env {
  readonly Room: DurableObjectNamespace<Room>;
  /** Pages allowed to connect (syntax: isAllowedOrigin in origin.ts). */
  readonly ALLOWED_ORIGINS?: string;
}

const STORAGE_KEY = 'room';

const send = (connection: Connection | undefined, message: ServerMessage) =>
  connection?.send(JSON.stringify(message));

/**
 * One table, one Durable Object (AGENTS.md §2). A thin adapter: it turns sockets and alarms into
 * room commands, supplies the clock and randomness, and carries out the effects the room returns.
 */
export class Room extends Server<Env> {
  static override options = { hibernate: true };

  private state: RoomState | null = null;

  override async onStart(): Promise<void> {
    this.state = (await this.ctx.storage.get<RoomState>(STORAGE_KEY)) ?? null;
  }

  override async onMessage(connection: Connection, raw: string | ArrayBuffer): Promise<void> {
    const parsed = parseClientMessage(typeof raw === 'string' ? raw : null);
    if (!parsed.ok) return void send(connection, { type: 'error', code: parsed.error.code });
    await this.run({ type: 'message', connection: connection.id, message: parsed.message });
  }

  override async onClose(connection: Connection): Promise<void> {
    await this.run({ type: 'disconnect', connection: connection.id });
  }

  override async onAlarm(): Promise<void> {
    await this.run({ type: 'wake' });
  }

  private async run(command: RoomCommand): Promise<void> {
    const env = {
      now: Date.now(),
      seed: crypto.getRandomValues(new Uint32Array(1))[0] ?? 0,
      token: crypto.randomUUID(),
    };
    const { room, effects } = applyRoomCommand(
      this.state ?? createRoom(this.name, env.now),
      command,
      env,
    );
    let wakeAt: number | null = null;
    for (const effect of effects) {
      switch (effect.type) {
        case 'send':
          send(this.getConnection(effect.connection), effect.message);
          break;
        case 'close':
          this.getConnection(effect.connection)?.close();
          break;
        case 'wakeAt':
          wakeAt = effect.at;
          break;
        case 'destroy':
          this.state = null;
          await this.ctx.storage.deleteAlarm();
          await this.ctx.storage.deleteAll();
          return;
      }
    }
    if (room !== this.state) {
      this.state = room;
      await this.ctx.storage.put(STORAGE_KEY, room);
    }
    if (wakeAt === null) await this.ctx.storage.deleteAlarm();
    else await this.ctx.storage.setAlarm(wakeAt);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Keeps other sites' pages from opening tables from a visitor's browser. Not authentication:
    // a script outside a browser can send any Origin.
    if (!isAllowedOrigin(request.headers.get('Origin'), env.ALLOWED_ORIGINS)) {
      return new Response('Forbidden', { status: 403 });
    }
    return (await routePartykitRequest(request, env)) ?? new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
