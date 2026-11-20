import {
  applyAction,
  getPlayerView,
  type Action,
  type Card,
  type DealState,
  type PlayerView,
  type Rng,
} from '@tarot/engine';
import type { Bot } from '../bot';
import { memoryFromTricks, type BotMemory } from '../memory';
import { mediumBot } from '../medium';
import { SIMULATED_CARDS, samplesFor } from './budget';
import { sampleDeal } from './sample-deal';

/** Moyen never draws on randomness; a constant source keeps playouts reproducible. */
const noRandomness: Rng = () => 0;

/** Plays a deal to its end with Moyen at every seat; returns the finished deal and its cards. */
function rollout(start: DealState): { end: DealState; cards: number } {
  let state = start;
  let cards = 0;
  while (state.turn !== null) {
    cards++;
    const seat = state.turn;
    const memory = memoryFromTricks(state.players, state.tricks, state.currentTrick);
    const { action } = mediumBot.decide(getPlayerView(state, seat), memory, noRandomness);
    const result = applyAction(state, seat, action);
    if (!result.ok) throw new Error(`Rollout refused ${JSON.stringify(action)}`);
    state = result.state;
  }
  return { end: state, cards };
}

/**
 * The playable card with the best average score for this seat over sampled deals (null when
 * none was sampled), and how many cards the simulations played, which the budget bounds.
 */
export function bestCard(
  view: PlayerView,
  memory: BotMemory,
  move: Action & { type: 'playCard' },
  cards: readonly Card[],
  rng: Rng,
  budget: number = SIMULATED_CARDS,
): { card: Card | null; simulatedCards: number } {
  const cardsLeft = view.handSizes.reduce((a, b) => a + b, 0);
  const samples = samplesFor(cards.length, cardsLeft, budget);
  const totals = new Map<Card, number>(cards.map((c) => [c, 0]));
  let sampled = 0;
  let simulatedCards = 0;
  for (let i = 0; i < samples; i++) {
    const deal = sampleDeal(view, memory, rng);
    if (deal === null) continue;
    sampled++;
    for (const card of cards) {
      const played = applyAction(deal, view.seat, { ...move, card });
      if (!played.ok) throw new Error(`Simulation refused ${card}`);
      const { end, cards: rolled } = rollout(played.state);
      simulatedCards += 1 + rolled;
      const score = end.result?.perSeat[view.seat] ?? 0;
      totals.set(card, (totals.get(card) ?? 0) + score);
    }
  }
  if (sampled === 0) return { card: null, simulatedCards };
  // Moyen's own choice wins ties: it is listed first.
  const ranked = [move.card, ...cards.filter((c) => c !== move.card)];
  const card = ranked.reduce((best, c) =>
    (totals.get(c) ?? 0) > (totals.get(best) ?? 0) ? c : best,
  );
  return { card, simulatedCards };
}

/**
 * Difficile (AGENTS.md §4, ADR-0005): Moyen's bidding, king call, écart and poignée; card play
 * by Monte-Carlo determinisation. Each playable card is played in sampled deals consistent with
 * what this seat knows, the rest played out by Moyen, and the best average score wins.
 * `budget`: most cards simulated per decision (budget.ts); the benchmark tries others.
 */
export function createHardBot(budget: number = SIMULATED_CARDS): Bot {
  return {
    level: 'hard',
    decide(view, previous, rng) {
      const decision = mediumBot.decide(view, previous, rng);
      const [template] = view.legalActions;
      const { action, memory } = decision;
      if (template?.type !== 'playCard' || action.type !== 'playCard') return decision;
      if (template.cards.length === 1) return decision;
      // In 5 players, while the partner is unknown each sampled deal settles it differently and
      // the simulations mislead: the benchmark showed Moyen's play is better until it is known.
      if (view.calledCard !== null && view.knownPartner === null) return decision;
      const { card } = bestCard(view, memory, action, template.cards, rng, budget);
      return card === null ? decision : { action: { ...action, card }, memory };
    },
  };
}

export const hardBot = createHardBot();
