/** Rule parameters that depend on the number of players (AGENTS.md §3). */
export interface VariantConfig {
  readonly players: number;
  readonly cardsPerPlayer: number;
  readonly chienSize: number;
  /** Cards dealt to a player in one go. */
  readonly dealBatch: number;
}

export type PlayerCount = 4;

const VARIANTS: Record<PlayerCount, VariantConfig> = {
  4: { players: 4, cardsPerPlayer: 18, chienSize: 6, dealBatch: 3 },
};

export function variantFor(players: PlayerCount): VariantConfig {
  return VARIANTS[players];
}
