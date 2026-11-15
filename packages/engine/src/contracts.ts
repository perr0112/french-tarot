/** Contracts and what each one does with the chien and the score (AGENTS.md §3.3). */
export const CONTRACTS = ['petite', 'garde', 'gardeSans', 'gardeContre'] as const;
export type Contract = (typeof CONTRACTS)[number];
export type BidChoice = 'pass' | Contract;

/**
 * Where the chien goes: into the taker's hand (then an écart is made), or set aside face down
 * for the taker's or the defence's tricks.
 */
export type ChienDestination = 'takerHand' | 'taker' | 'defence';

export interface ContractRule {
  readonly multiplier: number;
  readonly chien: ChienDestination;
}

export const CONTRACT_RULES: Readonly<Record<Contract, ContractRule>> = {
  petite: { multiplier: 1, chien: 'takerHand' },
  garde: { multiplier: 2, chien: 'takerHand' },
  gardeSans: { multiplier: 4, chien: 'taker' },
  gardeContre: { multiplier: 6, chien: 'defence' },
};

/** The chien is shown to everyone exactly when the taker takes it in hand. */
export const chienIsRevealed = (contract: Contract): boolean =>
  CONTRACT_RULES[contract].chien === 'takerHand';
