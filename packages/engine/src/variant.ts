/** Rule parameters that depend on the number of players (AGENTS.md §3). */
export interface VariantConfig {
  readonly players: number;
  readonly cardsPerPlayer: number;
  readonly chienSize: number;
  /** Cards dealt to a player in one go. */
  readonly dealBatch: number;
  /** Exact number of trumps to show for each poignée level. */
  readonly poigneeSizes: Readonly<Record<PoigneeLevel, number>>;
}

export type PoigneeLevel = 'simple' | 'double' | 'triple';

/** Poignée bonuses, not multiplied (AGENTS.md §3.6). */
export const POIGNEE_BONUS: Readonly<Record<PoigneeLevel, number>> = {
  simple: 20,
  double: 30,
  triple: 40,
};

export type PlayerCount = 4;

const VARIANTS: Record<PlayerCount, VariantConfig> = {
  4: {
    players: 4,
    cardsPerPlayer: 18,
    chienSize: 6,
    dealBatch: 3,
    poigneeSizes: { simple: 10, double: 13, triple: 15 },
  },
};

export function variantFor(players: PlayerCount): VariantConfig {
  return VARIANTS[players];
}
