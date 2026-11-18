import { ALL_CARDS, KING, isOudler, rankOf, type Card } from './cards';
import { CONTRACT_RULES, type Contract } from './contracts';
import {
  DEFAULT_DEAL_OPTIONS,
  nextSeat,
  type Bid,
  type DealOptions,
  type DealState,
  type Seat,
} from './deal';
import type { CurrentTrick, Trick } from './play';
import type { Poignee } from './poignee';
import { variantFor, type PlayerCount } from './variant';

/**
 * A deal in play as one seat could imagine it: the public history of the deal plus one full
 * guess of the hidden cards (bots' Monte-Carlo simulations, tests).
 */
export interface CreateDealInPlayInput {
  readonly players: PlayerCount;
  readonly dealer: Seat;
  readonly options?: DealOptions;
  readonly bids: readonly Bid[];
  readonly taker: Seat;
  readonly contract: Contract;
  readonly calledCard: Card | null;
  readonly chelemAnnounced: boolean;
  readonly poignees: readonly Poignee[];
  readonly tricks: readonly Trick[];
  readonly currentTrick: CurrentTrick | null;
  /** The cards each seat holds now. */
  readonly hands: readonly (readonly Card[])[];
  /** The chien as dealt. */
  readonly chien: readonly Card[];
  /** The taker's écart (petite, garde), else empty. */
  readonly ecart: readonly Card[];
}

/** Builds a deal in its playing phase. Throws on a distribution that cannot be. */
export function createDealInPlay(input: CreateDealInPlayInput): DealState {
  const { players, taker, contract, calledCard, tricks, currentTrick, hands, chien, ecart } = input;
  const variant = variantFor(players);
  const played = [...tricks.flatMap((t) => t.cards), ...(currentTrick?.cards ?? [])];
  const takesChien = CONTRACT_RULES[contract].chien === 'takerHand';
  const aside = takesChien ? ecart : chien;
  const all = [...hands.flat(), ...aside, ...played.map((p) => p.card)];
  const playedBy = (seat: Seat) => played.filter((p) => p.seat === seat).length;
  const takerCards = new Set([
    ...(hands[taker] ?? []),
    ...ecart,
    ...played.filter((p) => p.seat === taker).map((p) => p.card),
  ]);
  // Each trick is led by the previous one's winner and played in seat order.
  const firstLeader = input.chelemAnnounced ? taker : nextSeat(input.dealer, players);
  const leaders = [firstLeader, ...tricks.map((t) => t.winner)];
  const inOrder = (trick: CurrentTrick, index: number) =>
    trick.leader === leaders[index] &&
    trick.cards.every((p, k) => p.seat === (trick.leader + k) % players);
  if (
    !tricks.every(inOrder) ||
    (currentTrick !== null && !inOrder(currentTrick, tricks.length)) ||
    ecart.some((card) => isOudler(card) || rankOf(card) === KING) ||
    hands.length !== players ||
    hands.some((hand, seat) => hand.length !== variant.cardsPerPlayer - playedBy(seat)) ||
    chien.length !== variant.chienSize ||
    ecart.length !== (takesChien ? variant.chienSize : 0) ||
    (takesChien && chien.some((card) => !takerCards.has(card))) ||
    all.length !== ALL_CARDS.length ||
    new Set(all).size !== ALL_CARDS.length ||
    played.length === ALL_CARDS.length - aside.length
  ) {
    throw new Error('Invalid distribution');
  }

  // The partner holds, or held, the called card; nobody when the taker has it or it is aside.
  const holder =
    calledCard === null
      ? null
      : (played.find((p) => p.card === calledCard)?.seat ??
        hands.findIndex((hand) => hand.includes(calledCard)));
  const partner = holder === null || holder === -1 || holder === taker ? null : holder;

  const turn = currentTrick
    ? (currentTrick.leader + currentTrick.cards.length) % players
    : (tricks.at(-1)?.winner ?? firstLeader);

  return {
    players,
    options: input.options ?? DEFAULT_DEAL_OPTIONS,
    dealer: input.dealer,
    phase: 'playing',
    turn,
    hands,
    chien,
    bids: input.bids,
    taker,
    contract,
    calledCard,
    partner,
    ecart,
    chelemAnnounced: input.chelemAnnounced,
    poignees: input.poignees,
    tricks,
    currentTrick,
    result: null,
    cancelled: null,
  };
}
