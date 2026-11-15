/** Rule parameters that depend on the number of players (AGENTS.md §3). */
export interface VariantConfig {
  readonly players: number;
  readonly cardsPerPlayer: number;
  readonly chienSize: number;
  /** Cards dealt to a player in one go. */
  readonly dealBatch: number;
  /** Exact number of trumps to show for each poignée level. */
  readonly poigneeSizes: Readonly<Record<PoigneeLevel, number>>;
  /** How the deal score S is shared: the taker gets `taker × S`, each defender `defender × S`. */
  readonly scoreShares: { readonly taker: number; readonly defender: number };
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
    scoreShares: { taker: 3, defender: -1 },
  },
};

export function isPlayerCount(players: number): players is PlayerCount {
  return Object.hasOwn(VARIANTS, players);
}

export function variantFor(players: PlayerCount): VariantConfig {
  return VARIANTS[players];
}

/** Poignée levels of a variant with their exact sizes, smallest first. */
export function poigneeLevels(
  players: PlayerCount,
): readonly { readonly level: PoigneeLevel; readonly size: number }[] {
  const sizes = variantFor(players).poigneeSizes;
  return (['simple', 'double', 'triple'] as const).map((level) => ({ level, size: sizes[level] }));
}
