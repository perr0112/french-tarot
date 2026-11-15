import { EXCUSE, PETIT, cardHalfPoints, isOudler, type Card } from './cards';
import type { Contract, DealState, Seat } from './deal';
import { POIGNEE_BONUS, type PlayerCount, type PoigneeLevel } from './variant';

export type Side = 'taker' | 'defence';

export const MULTIPLIER: Readonly<Record<Contract, number>> = {
  petite: 1,
  garde: 2,
  gardeSans: 4,
  gardeContre: 6,
};

/** Points the taker needs, indexed by the number of oudlers they hold (AGENTS.md §3.8). */
const NEEDED_BY_OUDLERS = [56, 51, 41, 36] as const;

/** Everything scoring needs to know about a finished deal. */
export interface ScoreFacts {
  readonly players: PlayerCount;
  readonly taker: Seat;
  readonly contract: Contract;
  readonly takerHalfPoints: number;
  readonly takerOudlers: number;
  readonly petitAuBout: Side | null;
  readonly poignees: readonly { readonly seat: Seat; readonly level: PoigneeLevel }[];
  readonly chelem: { readonly announced: boolean; readonly achievedBy: Side | null };
}

/** Itemised result of a deal; every signed term is from the taker's side (ADR-0004). */
export interface Breakdown {
  readonly contract: Contract;
  readonly multiplier: number;
  readonly points: number;
  readonly oudlers: number;
  readonly needed: number;
  readonly made: boolean;
  readonly gap: number;
  readonly contractScore: number;
  readonly petitAuBout: number;
  readonly poignee: number;
  readonly chelem: number;
  readonly dealScore: number;
  /** Score change of each seat; sums to zero. */
  readonly perSeat: readonly number[];
}

function chelemTerm({ announced, achievedBy }: ScoreFacts['chelem']): number {
  if (achievedBy === 'taker') return announced ? 400 : 200;
  if (achievedBy === 'defence') return -200;
  return announced ? -200 : 0;
}

export function scoreDeal(facts: ScoreFacts): Breakdown {
  const multiplier = MULTIPLIER[facts.contract];
  const points = facts.takerHalfPoints / 2;
  const needed = NEEDED_BY_OUDLERS[facts.takerOudlers] ?? 36;
  const made = points >= needed;
  const sign = made ? 1 : -1;
  const gap = Math.abs(points - needed);

  const contractScore = sign * (25 + gap) * multiplier;
  const petitAuBout =
    facts.petitAuBout === null ? 0 : (facts.petitAuBout === 'taker' ? 1 : -1) * 10 * multiplier;
  const poignee = sign * facts.poignees.reduce((sum, p) => sum + POIGNEE_BONUS[p.level], 0);
  const chelem = chelemTerm(facts.chelem);
  const dealScore = contractScore + petitAuBout + poignee + chelem;

  const perSeat = Array.from({ length: facts.players }, (_, seat) =>
    seat === facts.taker ? (facts.players - 1) * dealScore : -dealScore,
  );

  return {
    contract: facts.contract,
    multiplier,
    points,
    oudlers: facts.takerOudlers,
    needed,
    made,
    gap,
    contractScore,
    petitAuBout,
    poignee,
    chelem,
    dealScore,
    perSeat,
  };
}

/** Counts a finished deal into score facts (AGENTS.md §3.7–3.8). */
export function dealFacts(state: DealState): ScoreFacts {
  const taker = state.taker as Seat;
  const contract = state.contract as Contract;
  const sideOf = (seat: Seat): Side => (seat === taker ? 'taker' : 'defence');

  const won: Record<Side, Card[]> = { taker: [], defence: [] };
  // Chien and écart: the écart counts for the taker; a hidden chien goes to whoever the contract says.
  if (contract === 'petite' || contract === 'garde') won.taker.push(...state.ecart);
  else won[contract === 'gardeSans' ? 'taker' : 'defence'].push(...state.chien);

  const lastIndex = state.tricks.length - 1;
  let takerHalfPointsAdjustment = 0;
  for (const [index, trick] of state.tricks.entries()) {
    const winnerSide = sideOf(trick.winner);
    for (const { seat, card } of trick.cards) {
      const ownerSide = sideOf(seat);
      if (card === EXCUSE && index !== lastIndex && ownerSide !== winnerSide) {
        // The owner keeps the Excuse and gives half a point to the trick winner's side.
        won[ownerSide].push(card);
        takerHalfPointsAdjustment += ownerSide === 'taker' ? -1 : 1;
      } else {
        won[winnerSide].push(card);
      }
    }
  }

  const halfPoints = (cards: Card[]) => cards.reduce((sum, c) => sum + cardHalfPoints(c), 0);
  const takerHalfPoints = halfPoints(won.taker) + takerHalfPointsAdjustment;

  const winners = state.tricks.map((t) => sideOf(t.winner));
  const achievedBy = winners.every((s) => s === 'taker')
    ? 'taker'
    : winners.every((s) => s === 'defence')
      ? 'defence'
      : null;

  return {
    players: state.players,
    taker,
    contract,
    takerHalfPoints,
    takerOudlers: won.taker.filter(isOudler).length,
    petitAuBout: petitAuBoutSide(state, sideOf),
    poignees: state.poignees,
    chelem: { announced: state.chelemAnnounced, achievedBy },
  };
}

/**
 * The Petit in the last trick scores for that trick's winner. When a chelem side ends with
 * the Excuse, the Petit counts "au bout" on the second-to-last trick instead.
 */
function petitAuBoutSide(state: DealState, sideOf: (seat: Seat) => Side): Side | null {
  const last = state.tricks.at(-1);
  const excuseLedLast = last?.cards[0]?.card === EXCUSE && last.winner === last.cards[0].seat;
  const bout = excuseLedLast ? state.tricks.at(-2) : last;
  if (bout === undefined || !bout.cards.some((p) => p.card === PETIT)) return null;
  return sideOf(bout.winner);
}
