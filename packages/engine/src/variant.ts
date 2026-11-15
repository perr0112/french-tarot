/** Rule parameters that depend on the number of players (AGENTS.md §3). */
export interface VariantConfig {
  readonly players: number;
  readonly cardsPerPlayer: number;
  readonly chienSize: number;
  /** Cards dealt to a player in one go. */
  readonly dealBatch: number;
  /** Exact number of trumps to show for each poignée level. */
  readonly poigneeSizes: Readonly<Record<PoigneeLevel, number>>;
  /**
   * How the deal score S is shared: each seat gets its share × S. `withPartner` is the 5-player
   * split when the taker has a partner; null in variants without one.
   */
  readonly scoreShares: {
    readonly alone: { readonly taker: number; readonly defender: number };
    readonly withPartner: {
      readonly taker: number;
      readonly partner: number;
      readonly defender: number;
    } | null;
  };
}

export type PoigneeLevel = 'simple' | 'double' | 'triple';

/** Poignée bonuses, not multiplied (AGENTS.md §3.6). */
export const POIGNEE_BONUS: Readonly<Record<PoigneeLevel, number>> = {
  simple: 20,
  double: 30,
  triple: 40,
};

export type PlayerCount = 3 | 4 | 5;

const VARIANTS: Record<PlayerCount, VariantConfig> = {
  3: {
    players: 3,
    cardsPerPlayer: 24,
    chienSize: 6,
    dealBatch: 4,
    poigneeSizes: { simple: 13, double: 15, triple: 18 },
    scoreShares: { alone: { taker: 2, defender: -1 }, withPartner: null },
  },
  4: {
    players: 4,
    cardsPerPlayer: 18,
    chienSize: 6,
    dealBatch: 3,
    poigneeSizes: { simple: 10, double: 13, triple: 15 },
    scoreShares: { alone: { taker: 3, defender: -1 }, withPartner: null },
  },
  5: {
    players: 5,
    cardsPerPlayer: 15,
    chienSize: 3,
    dealBatch: 3,
    poigneeSizes: { simple: 8, double: 10, triple: 13 },
    scoreShares: {
      alone: { taker: 4, defender: -1 },
      withPartner: { taker: 2, partner: 1, defender: -1 },
    },
  },
};

export function isPlayerCount(players: number): players is PlayerCount {
  return Object.hasOwn(VARIANTS, players);
}

/** Whether the taker calls a King to choose a partner: only variants with a partner share. */
export function hasKingCall(players: PlayerCount): boolean {
  return VARIANTS[players].scoreShares.withPartner !== null;
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
