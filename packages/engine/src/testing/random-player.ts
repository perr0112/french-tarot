import { applyAction, getLegalActions, type Action, type LegalAction } from '../actions';
import { EXCUSE, isTrump, type Card } from '../cards';
import type { DealState, Seat } from '../deal';

/** Small deterministic generator for test choices (independent of the engine's PRNG). */
export function choices(seed: number): (n: number) => number {
  let s = seed >>> 0 || 1;
  return (n) => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s % n;
  };
}

/** Picks a random action allowed by the legal templates. */
export function randomAction(template: LegalAction, pick: (n: number) => number): Action {
  switch (template.type) {
    case 'bid': {
      // Pass most of the time so that contracts of every level appear.
      const contract = pick(3) === 0 ? template.choices[pick(template.choices.length)] : 'pass';
      return { type: 'bid', contract: contract ?? 'pass' };
    }
    case 'callKing':
      return { type: 'callKing', card: template.cards[pick(template.cards.length)] as Card };
    case 'ecart': {
      const plain = template.eligible.filter((c) => !isTrump(c));
      const trumps = template.eligible.filter(isTrump);
      const pool = template.trumpsAllowed ? [...plain, ...trumps] : shuffled(plain, pick);
      return { type: 'ecart', cards: pool.slice(0, template.count) };
    }
    case 'decideChelem':
      return { type: 'decideChelem', announce: pick(10) === 0 };
    case 'playCard': {
      const card = template.cards[pick(template.cards.length)] as Card;
      const level = template.poignee?.levels[pick(template.poignee.levels.length)];
      if (template.poignee && level && pick(2) === 0) {
        const trumps = template.poignee.eligible.filter(isTrump);
        const shown =
          trumps.length >= level.size ? trumps.slice(0, level.size) : [...trumps, EXCUSE];
        return { type: 'playCard', card, poignee: shown };
      }
      return { type: 'playCard', card };
    }
  }
}

function shuffled<T>(items: readonly T[], pick: (n: number) => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/** Plays a deal to its end with random legal actions; throws if a legal action is refused. */
export function playRandomly(start: DealState, seed: number, maxSteps = 500): DealState {
  const pick = choices(seed);
  let state = start;
  for (let step = 0; step < maxSteps; step++) {
    if (state.phase === 'finished' || state.phase === 'cancelled') return state;
    const seat = state.turn as Seat;
    const [template] = getLegalActions(state, seat);
    if (!template) throw new Error(`No legal action for seat ${seat} in ${state.phase}`);
    const action = randomAction(template, pick);
    const result = applyAction(state, seat, action);
    if (!result.ok) throw new Error(`Refused ${JSON.stringify(action)}: ${result.error.code}`);
    state = result.state;
  }
  throw new Error('Deal did not terminate');
}
