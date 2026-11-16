import {
  applyAction,
  createDeal,
  createRng,
  getPlayerView,
  type DealOptions,
  type DealState,
  type PlayerCount,
  type Seat,
} from '@tarot/engine';
import type { Bot } from './bot';
import { emptyMemory } from './memory';

export interface SimulateDealInput {
  readonly players: PlayerCount;
  readonly dealer: Seat;
  readonly seed: number;
  /** One bot per seat. */
  readonly bots: readonly Bot[];
  readonly options?: DealOptions;
}

/**
 * Plays one deal with bots only, each seeing its own view, as the room server will.
 * Throws if the engine refuses a bot's action. Deterministic for a given seed.
 */
export function simulateDeal({
  players,
  dealer,
  seed,
  bots,
  options,
}: SimulateDealInput): DealState {
  let state = createDeal({ players, dealer, seed, ...(options ? { options } : {}) });
  const memories = bots.map(emptyMemory);
  const rngs = bots.map((_, seat) => createRng((seed * 31 + seat + 1) >>> 0));
  for (let step = 0; step < 1000; step++) {
    if (state.turn === null) return state;
    const seat = state.turn;
    const bot = bots[seat];
    if (!bot) throw new Error(`No bot at seat ${seat}`);
    const { action, memory } = bot.decide(
      getPlayerView(state, seat),
      memories[seat] ?? emptyMemory(),
      rngs[seat] as () => number,
    );
    memories[seat] = memory;
    const result = applyAction(state, seat, action);
    if (!result.ok) {
      throw new Error(
        `${bot.level} bot at seat ${seat}: ${JSON.stringify(action)} refused (${result.error.code})`,
      );
    }
    state = result.state;
  }
  throw new Error('Deal did not terminate');
}
