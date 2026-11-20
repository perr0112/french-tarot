/** Most sampled deals per decision: the same ones judge every playable card. */
export const SAMPLES = 20;

/**
 * Most cards played in the simulations of one decision (ADR-0005). It bounds the decision's CPU
 * time — a few milliseconds, inside the 10 ms a request gets on Cloudflare's free plan — and,
 * unlike a time budget, gives the same decision for the same seed on any machine.
 */
export const SIMULATED_CARDS = 150;

/**
 * How many sampled deals a decision can afford: each costs one playout per playable card, each
 * as long as the cards left in the deal. Zero early in a deal, where Moyen's card is played.
 */
export function samplesFor(
  playable: number,
  cardsLeft: number,
  budget: number = SIMULATED_CARDS,
): number {
  return Math.min(SAMPLES, Math.floor(budget / (playable * cardsLeft)));
}
