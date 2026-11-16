import {
  ALL_CARDS,
  EXCUSE,
  PETIT,
  TWENTY_ONE,
  cardHalfPoints,
  isTrump,
  rankOf,
  suitOf,
  trickWinner,
  trumpValue,
  type Card,
  type PlayedCard,
  type PlayerView,
  type Seat,
} from '@tarot/engine';
import { colourOf, type BotMemory, type Colour } from '../memory';

/** Card play context: what the bot knows when it must play. */
interface Situation {
  readonly view: PlayerView;
  readonly memory: BotMemory;
  readonly legal: readonly Card[];
  /** Cards not in this hand, not played and not known to be aside: maybe in another hand. */
  readonly unseen: readonly Card[];
}

const strength = (card: Card) => trumpValue(card) ?? rankOf(card) ?? 0;
const byValueThenStrength = (a: Card, b: Card) =>
  cardHalfPoints(a) - cardHalfPoints(b) || strength(a) - strength(b);
const cheapest = (cards: readonly Card[]) => [...cards].sort(byValueThenStrength)[0];
const dearest = (cards: readonly Card[]) => [...cards].sort(byValueThenStrength).at(-1);

/** Whether a seat plays on the taker's side, as far as this seat knows; null when unknown. */
function onTakerSide(view: PlayerView, seat: Seat): boolean | null {
  if (seat === view.taker) return true;
  if (typeof view.knownPartner === 'number') return seat === view.knownPartner;
  if (view.knownPartner === 'alone' || view.calledCard === null) return false;
  return null; // 5 players, partner not yet revealed
}

/** Allies are known to be on the same side; an unknown seat is never treated as an ally. */
function isAlly(view: PlayerView, seat: Seat): boolean {
  if (seat === view.seat) return true;
  const mine = onTakerSide(view, view.seat);
  const theirs = onTakerSide(view, seat);
  return mine !== null && theirs !== null && mine === theirs;
}

/** Seats still to play in the current trick after this one, in order. */
function seatsAfter(view: PlayerView): Seat[] {
  const played = view.currentTrick?.cards.length ?? 0;
  return Array.from(
    { length: view.players - played - 1 },
    (_, i) => (view.seat + 1 + i) % view.players,
  );
}

function unseenCards(view: PlayerView, memory: BotMemory): Card[] {
  const known = new Set<Card>([
    ...view.hand,
    ...memory.played,
    ...(view.ownEcart ?? []),
    ...view.shownEcartTrumps,
  ]);
  return ALL_CARDS.filter((c) => !known.has(c));
}

const lacks = (memory: BotMemory, seat: Seat, colour: Colour) =>
  memory.voids[seat]?.includes(colour) ?? false;

/** Whether `seat` might beat `best` in a trick led in `led` colour, from what is unseen. */
function mightBeat(s: Situation, seat: Seat, best: Card, led: Colour): boolean {
  const higherTrumps = s.unseen.some((c) => isTrump(c) && strength(c) > strength(best));
  const canTrump = !lacks(s.memory, seat, 'T') && higherTrumps;
  if (isTrump(best)) return canTrump;
  const higherInSuit = s.unseen.some(
    (c) => suitOf(c) === suitOf(best) && strength(c) > strength(best),
  );
  return (higherInSuit && !lacks(s.memory, seat, led)) || canTrump;
}

/** Whether `trick` (with the bot's card in it, if any) is surely won by the winner's side. */
function surelyKept(s: Situation, trick: readonly PlayedCard[]): boolean {
  const winner = trickWinner(trick);
  const best = trick.find((p) => p.seat === winner)?.card;
  const led = colourOf(trick.find((p) => p.card !== EXCUSE)?.card ?? EXCUSE);
  if (best === undefined || led === null) return false;
  return seatsAfter(s.view)
    .filter((seat) => !isAlly(s.view, seat) || !isAlly(s.view, winner))
    .every((seat) => !mightBeat(s, seat, best, led));
}

/** Plays the Excuse rather than giving points, or the cheapest card, keeping the Petit. */
function giveAway(s: Situation): Card {
  const others = s.legal.filter((c) => c !== EXCUSE);
  const safe = others.filter((c) => c !== PETIT);
  const card = cheapest(safe.length > 0 ? safe : others);
  if (card === undefined || (s.legal.includes(EXCUSE) && cardHalfPoints(card) >= 3)) return EXCUSE;
  return card;
}

/** Plays the most valuable card on a trick the bot's side keeps; the 21 stays a master. */
function loadTrick(s: Situation): Card {
  const pool = s.legal.filter((c) => c !== EXCUSE && c !== TWENTY_ONE);
  const best = [...pool].sort(
    (a, b) => cardHalfPoints(b) - cardHalfPoints(a) || strength(a) - strength(b),
  )[0];
  return best ?? giveAway(s);
}

function follow(s: Situation, trick: readonly PlayedCard[]): Card {
  const me = s.view.seat;
  const winner = trickWinner(trick);
  if (isAlly(s.view, winner)) {
    return surelyKept(s, trick) ? loadTrick(s) : giveAway(s);
  }
  const withMine = (card: Card) => [...trick, { seat: me, card }];
  const winning = s.legal.filter((c) => c !== EXCUSE && trickWinner(withMine(c)) === me);
  const sure = winning.filter((c) => surelyKept(s, withMine(c)));
  // The Petit only goes into a trick it surely wins.
  const takers = winning.filter((c) => c !== PETIT || sure.includes(c));
  const worth = trick.some(({ card }) => cardHalfPoints(card) >= 3);
  if (sure.includes(PETIT)) return PETIT; // brought home safely
  const take = cheapest(sure.length > 0 ? sure : worth ? takers : []);
  return take ?? giveAway(s);
}

/** Lowest card, by strength, of the given suit cards. */
const lowest = (cards: readonly Card[]) => [...cards].sort((a, b) => strength(a) - strength(b))[0];

function lead(s: Situation): Card {
  const { view, memory, legal, unseen } = s;
  const plainTrumps = legal.filter((c) => isTrump(c) && c !== PETIT);
  const suitCards = legal.filter((c) => suitOf(c) !== null);
  const opponents = view.players - 1 - (typeof view.knownPartner === 'number' ? 1 : 0);
  const unseenTrumps = unseen.filter(isTrump);
  const lengthOf = (card: Card) => suitCards.filter((c) => suitOf(c) === suitOf(card)).length;

  if (onTakerSide(view, view.seat) === true) {
    // Draw the defence's trumps while holding more than its share.
    const trumps = legal.filter(isTrump);
    if (unseenTrumps.length > 0 && trumps.length > unseenTrumps.length / opponents) {
      const top = Math.max(...unseenTrumps.map(strength));
      const master = trumps.find((c) => strength(c) > top);
      const card = master ?? lowest(plainTrumps);
      if (card !== undefined) return card;
    }
    const masters = suitCards.filter(
      (c) =>
        !unseen.some((u) => suitOf(u) === suitOf(c) && strength(u) > strength(c)) &&
        !Array.from({ length: view.players }, (_, seat) => seat).some(
          (seat) => !isAlly(view, seat) && lacks(memory, seat, suitOf(c) as Colour),
        ),
    );
    const master = dearest(masters);
    if (master !== undefined) return master;
    const longest = [...suitCards].sort(
      (a, b) => lengthOf(b) - lengthOf(a) || strength(a) - strength(b),
    )[0];
    if (longest !== undefined) return longest;
  } else {
    // Make the taker spend trumps in a suit it lacks, else open a short suit.
    const taker = view.taker ?? -1;
    const takerVoid = suitCards.filter((c) => lacks(memory, taker, suitOf(c) as Colour));
    const shortest = [...suitCards].sort(
      (a, b) => lengthOf(a) - lengthOf(b) || strength(a) - strength(b),
    )[0];
    const card = lowest(takerVoid) ?? shortest;
    if (card !== undefined) return card;
  }
  return lowest(plainTrumps) ?? giveAway(s);
}

/**
 * Moyen's card play (rules agreed for milestone 3): load a trick the partner surely keeps,
 * take a valuable trick cheaply, otherwise give the cheapest card; keep the Petit out of
 * danger and the Excuse out of the last trick; taker draws trumps, defence avoids leading them.
 */
export function chooseCard(view: PlayerView, memory: BotMemory, legal: readonly Card[]): Card {
  const s: Situation = { view, memory, legal, unseen: unseenCards(view, memory) };
  const [only] = legal;
  if (only === undefined) throw new Error('No playable card');
  if (legal.length === 1) return only;
  if (legal.includes(EXCUSE) && view.hand.length === 2) return EXCUSE;
  const trick = view.currentTrick?.cards ?? [];
  return trick.some((p) => p.card !== EXCUSE) ? follow(s, trick) : lead(s);
}
