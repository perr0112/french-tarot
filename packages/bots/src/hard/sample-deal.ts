import {
  ALL_CARDS,
  CONTRACT_RULES,
  KING,
  createDealInPlay,
  isOudler,
  isTrump,
  rankOf,
  variantFor,
  type Card,
  type DealState,
  type PlayerView,
  type Rng,
  type Seat,
} from '@tarot/engine';
import { colourOf, completedTricks, knowsEveryTrick, type BotMemory } from '../memory';

/** Where an unseen card may lie: another seat's hand, or the cards set aside (chien or écart). */
type Slot = Seat | 'aside';

const ATTEMPTS = 20;

/**
 * A sampled deal: one full distribution of the hidden cards, consistent with everything the seat
 * knows (its hand, the cards played, the colours others lack, shown poignées and écart trumps,
 * the revealed chien, a known partner), as a deal in play the engine can play out. Null when none fits, or when the
 * memory misses part of the deal's tricks.
 */
export function sampleDeal(view: PlayerView, memory: BotMemory, rng: Rng): DealState | null {
  const { taker, contract } = view;
  if (view.phase !== 'playing' || taker === null || contract === null) return null;
  if (!knowsEveryTrick(memory, completedTricks(view))) return null;

  const me = view.seat;
  const takesChien = CONTRACT_RULES[contract].chien === 'takerHand';
  const { chienSize } = variantFor(view.players);
  const played = new Set(memory.played);
  const unplayed = (cards: readonly Card[]) => cards.filter((c) => !played.has(c));

  // Cards whose place is known.
  const hands: Card[][] = view.handSizes.map((_, seat) => (seat === me ? [...view.hand] : []));
  const aside: Card[] = [...(view.ownEcart ?? (takesChien ? view.shownEcartTrumps : []))];
  // A shown poignée stays in its owner's hand, but for the trumps a taker shows again from the
  // écart (FFT p. 6), which stay aside.
  for (const p of view.poignees) {
    if (p.seat !== me) hands[p.seat]?.push(...unplayed(p.cards).filter((c) => !aside.includes(c)));
  }
  const called = view.calledCard;
  const calledHidden = called !== null && !played.has(called) && !view.hand.includes(called);
  if (calledHidden && typeof view.knownPartner === 'number') hands[view.knownPartner]?.push(called);

  const placed = new Set([...hands.flat(), ...aside]);
  const pool = ALL_CARDS.filter((c) => !played.has(c) && !placed.has(c));
  const freePlaces = (slot: Slot) =>
    slot === 'aside'
      ? chienSize - aside.length
      : (view.handSizes[slot] ?? 0) - (hands[slot]?.length ?? 0);
  const revealedChien = new Set(view.chien ?? []);

  /** Slots a card may go to, from the rules and what the table has shown. */
  const slotsFor = (card: Card): Slot[] => {
    const seats = view.handSizes
      .map((_, seat) => seat)
      .filter((seat) => seat !== me)
      .filter((seat) => {
        const colour = colourOf(card);
        return colour === null || !memory.voids[seat]?.includes(colour);
      });
    // The écart holds no King or oudler, and trumps only when shown; a hidden chien holds anything.
    const asideOk = takesChien
      ? view.ownEcart === null && !isTrump(card) && !isOudler(card) && rankOf(card) !== KING
      : true;
    let slots: Slot[] = asideOk ? [...seats, 'aside'] : seats;
    // A revealed chien went into the taker's hand; what is left of it is there or in the écart.
    if (revealedChien.has(card)) slots = slots.filter((s) => s === taker || s === 'aside');
    // A taker known to play alone holds the called card, unless it lies in the hidden chien.
    if (calledHidden && card === called && view.knownPartner === 'alone') {
      slots = slots.filter((s) => s === taker || (s === 'aside' && !takesChien));
    }
    return slots;
  };
  const options = pool.map((card) => ({ card, slots: slotsFor(card) }));

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const sampled = hands.map((hand) => [...hand]);
    const sampledAside = [...aside];
    const free = new Map<Slot, number>(
      [...view.handSizes.keys(), 'aside' as const].map((slot): [Slot, number] => [
        slot,
        freePlaces(slot),
      ]),
    );
    const openFor = (slots: readonly Slot[]) => slots.filter((s) => (free.get(s) ?? 0) > 0);
    const left = [...options];
    let fits = true;
    while (left.length > 0) {
      // The card with the fewest open places goes first, so no card is left without one.
      let index = 0;
      let fewest = Infinity;
      left.forEach(({ slots }, i) => {
        const count = openFor(slots).length;
        if (count < fewest) {
          index = i;
          fewest = count;
        }
      });
      const [{ card, slots }] = left.splice(index, 1) as [(typeof options)[number]];
      // Weighted by free places, which draws each consistent deal about evenly.
      const open = openFor(slots);
      const total = open.reduce<number>((sum, s) => sum + (free.get(s) ?? 0), 0);
      let ticket = rng() * total;
      const slot = open.find((s) => (ticket -= free.get(s) ?? 0) < 0) ?? open.at(-1);
      if (slot === undefined) {
        fits = false;
        break;
      }
      free.set(slot, (free.get(slot) ?? 0) - 1);
      if (slot === 'aside') sampledAside.push(card);
      else sampled[slot]?.push(card);
    }
    if (!fits) continue;
    try {
      return createDealInPlay({
        players: view.players,
        dealer: view.dealer,
        bids: view.bids,
        taker,
        contract,
        calledCard: called,
        chelemAnnounced: view.chelemAnnounced,
        poignees: view.poignees,
        tricks: memory.tricks,
        currentTrick: view.currentTrick,
        hands: sampled,
        chien: takesChien ? (view.chien ?? []) : sampledAside,
        ecart: takesChien ? sampledAside : [],
      });
    } catch {
      // Inconsistent with a rule the slots do not encode: draw again.
    }
  }
  return null;
}
