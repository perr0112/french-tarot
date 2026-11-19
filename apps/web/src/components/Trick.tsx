import type { PlayedCard, Seat } from '@tarot/engine';
import { useLayoutEffect, useRef, useState } from 'react';
import type { SeatPosition } from '../lib/seats';
import { FROM_SEAT_SCALE, flyIn, flyOut, handBox, seatBox } from '../motion/animate';
import { trickChanges, type ShownTrick } from '../motion/trickChanges';
import { CardFace } from './Card';
import styles from './Trick.module.css';

/** A completed trick on its way to its winner, drawn where it stood until its cards are gone. */
interface Collecting {
  /** The trick's cards: no two tricks of a deal share one. */
  readonly id: string;
  readonly winner: Seat;
  readonly cards: readonly PlayedCard[];
}

/** What the last change of the shown trick asks to animate. */
interface Motion {
  readonly arrived: readonly PlayedCard[];
  readonly collecting: Collecting | null;
}

const noMotion: Motion = { arrived: [], collecting: null };
const cardsKey = (cards: readonly PlayedCard[]) => cards.map((c) => c.card).join();
const keyOf = ({ cards, winner }: ShownTrick) => `${cardsKey(cards)}|${winner}`;

/** The shown trick as last rendered, and the last one shown while animated (before a review). */
interface Previous {
  readonly key: string;
  readonly animated: boolean;
  readonly lastAnimated: ShownTrick | null;
}

/**
 * The cards of a trick, each placed towards the seat that played it. When `animated`, a new card
 * comes from the seat that played it (the local player's from its place in the hand), and a
 * completed trick slides to its winner when the next one is led (DESIGN.md §3.6).
 */
export function Trick({
  cards,
  winner = null,
  positions,
  me,
  label,
  caption,
  muted = false,
  animated = false,
}: {
  cards: readonly PlayedCard[];
  /** Set once the trick is complete. */
  winner?: Seat | null;
  positions: readonly SeatPosition[];
  /** The local seat, whose cards leave from the hand. */
  me: Seat;
  label: string;
  /** Shown under the trick, e.g. who won the last one. */
  caption?: string | undefined;
  /** A trick looked back at, not the one being played. */
  muted?: boolean;
  /**
   * Animate changes; off while looking back, so opening the review moves nothing. Once it is
   * back on, changes are counted from the trick shown before the review.
   */
  animated?: boolean;
}) {
  const shown: ShownTrick = { cards, winner };
  const key = keyOf(shown);
  const list = useRef<HTMLOListElement>(null);

  // What changed is worked out while rendering (React's "previous props" pattern), so a
  // collected trick is drawn in the same frame as the card that replaces it.
  const [previous, setPrevious] = useState<Previous | null>(null);
  const [motion, setMotion] = useState<Motion>(noMotion);
  if (previous?.key !== key || previous.animated !== animated) {
    const base = animated ? (previous?.lastAnimated ?? null) : null;
    const changes = trickChanges(base, shown);
    setPrevious({
      key,
      animated,
      lastAnimated: animated ? shown : (previous?.lastAnimated ?? null),
    });
    setMotion({
      arrived: changes.arrived,
      collecting: changes.collected
        ? { id: cardsKey(changes.collected.cards), ...changes.collected }
        : animated
          ? motion.collecting
          : null,
    });
  }

  useLayoutEffect(() => {
    const root = list.current;
    if (!root) return;
    // Runs for the arrivals of each change only: cards already in place must not fly again.
    for (const { seat, card } of motion.arrived) {
      const element = root.querySelector(`[data-card="${card}"]`);
      if (!element) continue;
      const fromHand = seat === me ? handBox(card) : null;
      if (fromHand) flyIn(element, fromHand);
      else flyIn(element, seatBox(seat), { scale: FROM_SEAT_SCALE });
    }
  }, [motion.arrived, me]);

  const collecting = motion.collecting;
  useLayoutEffect(() => {
    const root = list.current;
    if (!root || !collecting) return;
    let mounted = true;
    const done = () => {
      if (mounted) {
        setMotion((m) => (m.collecting?.id === collecting.id ? { ...m, collecting: null } : m));
      }
    };
    const target = seatBox(collecting.winner);
    const flights = [...root.querySelectorAll('[data-collecting]')].map((el) => flyOut(el, target));
    if (flights.some((f) => f === null)) {
      done();
      return;
    }
    void Promise.all(flights.map((f) => f?.finished)).then(done, done);
    return () => {
      mounted = false;
      flights.forEach((f) => f?.cancel());
    };
  }, [collecting]);

  const place = (seat: Seat) => styles[positions[seat] ?? 'top'];

  return (
    // Nothing to show before the first card of a deal (kept mounted, so that card flies in).
    <figure
      className={`${styles.figure} ${muted ? styles.muted : ''}`}
      hidden={cards.length === 0 && !collecting}
    >
      <ol ref={list} className={styles.trick} aria-label={label}>
        {collecting?.cards.map(({ seat, card }) => (
          <li
            key={`collecting-${collecting.id}-${card}`}
            className={`${place(seat)} ${styles.collecting}`}
            data-collecting=""
            aria-hidden
          >
            <CardFace card={card} />
          </li>
        ))}
        {cards.map(({ seat, card }) => (
          <li key={card} className={place(seat)} data-card={card}>
            <CardFace card={card} />
          </li>
        ))}
      </ol>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
