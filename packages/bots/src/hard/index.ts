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
import { sampleDeal } from './sample-deal';

/** Sampled deals per decision: the same ones judge every playable card. */
export const SAMPLES = 20;
/** Most deals played out per decision, which bounds its time; fewer samples when many cards. */
export const ROLLOUTS = 200;

/** Moyen never draws on randomness; a constant source keeps playouts reproducible. */
const noRandomness: Rng = () => 0;

/** Plays a deal to its end with Moyen at every seat; returns the finished deal. */
function rollout(start: DealState): DealState {
  let state = start;
  while (state.turn !== null) {
    const seat = state.turn;
    const memory = memoryFromTricks(state.players, state.tricks, state.currentTrick);
    const { action } = mediumBot.decide(getPlayerView(state, seat), memory, noRandomness);
    const result = applyAction(state, seat, action);
    if (!result.ok) throw new Error(`Rollout refused ${JSON.stringify(action)}`);
    state = result.state;
  }
  return state;
}

/** The playable card with the best average score for this seat over sampled deals, if any. */
function bestCard(
  view: PlayerView,
  memory: BotMemory,
  move: Action & { type: 'playCard' },
  cards: readonly Card[],
  rng: Rng,
): Card | null {
  const totals = new Map<Card, number>(cards.map((c) => [c, 0]));
  let sampled = 0;
  const draws = Math.max(1, Math.min(SAMPLES, Math.floor(ROLLOUTS / cards.length)));
  for (let i = 0; i < draws; i++) {
    const deal = sampleDeal(view, memory, rng);
    if (deal === null) continue;
    sampled++;
    for (const card of cards) {
      const played = applyAction(deal, view.seat, { ...move, card });
      if (!played.ok) throw new Error(`Simulation refused ${card}`);
      const score = rollout(played.state).result?.perSeat[view.seat] ?? 0;
      totals.set(card, (totals.get(card) ?? 0) + score);
    }
  }
  if (sampled === 0) return null;
  // Moyen's own choice wins ties: it is listed first.
  const ranked = [move.card, ...cards.filter((c) => c !== move.card)];
  return ranked.reduce((best, card) =>
    (totals.get(card) ?? 0) > (totals.get(best) ?? 0) ? card : best,
  );
}

/**
 * Difficile (AGENTS.md §4, ADR-0005): Moyen's bidding, king call, écart and poignée; card play
 * by Monte-Carlo determinisation. Each playable card is played in sampled deals consistent with
 * what this seat knows, the rest played out by Moyen, and the best average score wins.
 */
export const hardBot: Bot = {
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
    const card = bestCard(view, memory, action, template.cards, rng);
    return card === null ? decision : { action: { ...action, card }, memory };
  },
};
