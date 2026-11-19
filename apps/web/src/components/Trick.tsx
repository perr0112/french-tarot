import type { PlayedCard, Seat } from '@tarot/engine';
import { useLayoutEffect, useRef, useState } from 'react';
import type { SeatPosition } from '../lib/seats';
import { FROM_SEAT_SCALE, flyIn, flyOut, handBox, seatBox } from '../motion/animate';
import { trickChanges, type ShownTrick } from '../motion/trickChanges';
import { CardFace } from './Card';
import styles from './Trick.module.css';

/** A completed trick on its way to its winner, drawn where it stood until its cards are gone. */
interface Collecting {
  readonly id: number;
  readonly winner: Seat;
  readonly cards: readonly PlayedCard[];
}

/** What the last change of the shown trick asks to animate. */
interface Motion {
  readonly arrived: readonly PlayedCard[];
  readonly collecting: Collecting | null;
}

const still: Motion = { arrived: [], collecting: null };
const keyOf = ({ cards, winner }: ShownTrick) => `${cards.map((c) => c.card).join()}|${winner}`;
let collections = 0;

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
  /** Animate changes; off while looking back, so toggling the review moves nothing. */
  animated?: boolean;
}) {
  const shown: ShownTrick = { cards, winner };
  const key = keyOf(shown);
  const list = useRef<HTMLOListElement>(null);

  // What changed is worked out while rendering, so a collected trick is drawn in the same frame
  // as the card that replaces it.
  const [seen, setSeen] = useState<{ key: string; shown: ShownTrick; animated: boolean } | null>(
    null,
  );
  const [motion, setMotion] = useState<Motion>(still);
  if (seen?.key !== key || seen.animated !== animated) {
    const changes =
      animated && seen?.animated ? trickChanges(seen.shown, shown) : trickChanges(null, shown);
    setSeen({ key, shown, animated });
    setMotion({
      arrived: changes.arrived,
      collecting: changes.collected
        ? { id: ++collections, ...changes.collected }
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
    const done = () =>
      setMotion((m) => (m.collecting?.id === collecting.id ? { ...m, collecting: null } : m));
    const target = seatBox(collecting.winner);
    const flights = [...root.querySelectorAll('[data-collecting]')].map((el) => flyOut(el, target));
    if (flights.some((f) => f === null)) {
      done();
      return;
    }
    void Promise.all(flights.map((f) => f?.finished)).then(done, done);
  }, [collecting]);

  return (
    <figure className={`${styles.figure} ${muted ? styles.muted : ''}`}>
      <ol ref={list} className={styles.trick} aria-label={label}>
        {collecting?.cards.map(({ seat, card }) => (
          <li
            key={`collecting-${collecting.id}-${card}`}
            className={`${styles[positions[seat] ?? 'top']} ${styles.collecting}`}
            data-collecting=""
            aria-hidden
          >
            <CardFace card={card} />
          </li>
        ))}
        {cards.map(({ seat, card }) => (
          <li key={card} className={styles[positions[seat] ?? 'top']} data-card={card}>
            <CardFace card={card} />
          </li>
        ))}
      </ol>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
