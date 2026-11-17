import { EXCUSE, PETIT, cardHalfPoints, isOudler, type Card } from './cards';
import { CONTRACT_RULES, type Contract } from './contracts';
import { isTakerSide, type DealState, type Seat } from './deal';
import { POIGNEE_BONUS, variantFor, type PlayerCount, type PoigneeLevel } from './variant';

export type Side = 'taker' | 'defence';

export type OudlerCount = 0 | 1 | 2 | 3;

/** Points the taker needs, by the number of oudlers they hold (AGENTS.md §3.8). */
const NEEDED_BY_OUDLERS: Readonly<Record<OudlerCount, number>> = { 0: 56, 1: 51, 2: 41, 3: 36 };

/** Everything scoring needs to know about a finished deal. */
export interface ScoreFacts {
  readonly players: PlayerCount;
  readonly taker: Seat;
  readonly partner: Seat | null;
  readonly contract: Contract;
  readonly takerHalfPoints: number;
  readonly takerOudlers: OudlerCount;
  readonly petitAuBout: Side | null;
  readonly poignees: readonly { readonly seat: Seat; readonly level: PoigneeLevel }[];
  readonly chelem: { readonly announced: boolean; readonly achievedBy: Side | null };
}

/** Itemised result of a deal; every signed term is from the taker's side (ADR-0004). */
export interface Breakdown {
  readonly contract: Contract;
  readonly taker: Seat;
  readonly partner: Seat | null;
  readonly multiplier: number;
  /** The taker's side's points, which may end in a half point in 3 or 5 players. */
  readonly points: number;
  readonly oudlers: number;
  readonly needed: number;
  readonly made: boolean;
  /** Distance to the points needed, the half point going to the winning side. */
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

function shareOf({ players, taker, partner }: ScoreFacts, seat: Seat): number {
  const { alone, withPartner } = variantFor(players).scoreShares;
  if (partner !== null && withPartner !== null) {
    if (seat === taker) return withPartner.taker;
    return seat === partner ? withPartner.partner : withPartner.defender;
  }
  return seat === taker ? alone.taker : alone.defender;
}

export function scoreDeal(facts: ScoreFacts): Breakdown {
  const multiplier = CONTRACT_RULES[facts.contract].multiplier;
  const points = facts.takerHalfPoints / 2;
  const needed = NEEDED_BY_OUDLERS[facts.takerOudlers];
  const made = points >= needed;
  const sign = made ? 1 : -1;
  const gap = Math.ceil(Math.abs(points - needed));

  const contractScore = sign * (25 + gap) * multiplier;
  const petitAuBout =
    facts.petitAuBout === null ? 0 : (facts.petitAuBout === 'taker' ? 1 : -1) * 10 * multiplier;
  const poignee = sign * facts.poignees.reduce((sum, p) => sum + POIGNEE_BONUS[p.level], 0);
  const chelem = chelemTerm(facts.chelem);
  const dealScore = contractScore + petitAuBout + poignee + chelem;

  const perSeat = Array.from(
    { length: facts.players },
    (_, seat) => shareOf(facts, seat) * dealScore,
  );

  return {
    contract: facts.contract,
    taker: facts.taker,
    partner: facts.partner,
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
  const sideOf = (seat: Seat): Side => (isTakerSide(state, seat) ? 'taker' : 'defence');

  const won: Record<Side, Card[]> = { taker: [], defence: [] };
  // The écart counts for the taker; a chien set aside goes to the side the contract names.
  const chien = CONTRACT_RULES[contract].chien;
  if (chien === 'takerHand') won.taker.push(...state.ecart);
  else won[chien].push(...state.chien);

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
    partner: state.partner,
    contract,
    takerHalfPoints,
    takerOudlers: won.taker.filter(isOudler).length as OudlerCount,
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
  const petitTrick = excuseLedLast ? state.tricks.at(-2) : last;
  if (petitTrick === undefined || !petitTrick.cards.some((p) => p.card === PETIT)) return null;
  return sideOf(petitTrick.winner);
}
