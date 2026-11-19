import type { Seat } from '@tarot/engine';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ChienOnTable } from '../lib/chien';
import { flyOut, layoutBox, rememberChienBox, seatBox, turnOver } from '../motion/animate';
import { fr } from '../strings/fr';
import { CardBack, CardFace } from './Card';
import styles from './Chien.module.css';

/** The chien on its way out of the centre: to a seat, or to the whole defence (null). */
interface Leaving {
  readonly chien: ChienOnTable;
  readonly to: Seat | null;
}

interface Motion {
  readonly turned: boolean;
  readonly leaving: Leaving | null;
}

const keyOf = (chien: ChienOnTable | null) =>
  chien === null ? 'none' : chien.faceUp ? chien.cards.join() : `down:${chien.count}`;

/** The cards of a chien, face up or down. */
function Cards({ chien }: { chien: ChienOnTable }) {
  return chien.faceUp
    ? chien.cards.map((card) => (
        <li key={card} className={styles.card}>
          <CardFace card={card} />
        </li>
      ))
    : Array.from({ length: chien.count }, (_, i) => (
        <li key={i} className={styles.card}>
          <CardBack />
        </li>
      ));
}

/**
 * The chien in the centre of the table (AGENTS.md §3.3–3.4): face down from the deal, turned
 * over for all to see in a petite or garde, then taken by the taker — into the local hand, or
 * sliding to the taker's seat — or set aside for the defence in a garde contre.
 */
export function Chien({
  chien,
  leavesTo,
}: {
  chien: ChienOnTable | null;
  /** Where it goes once it leaves the centre (lib/chien.ts). */
  leavesTo: Seat | 'hand' | null;
}) {
  const key = keyOf(chien);
  const list = useRef<HTMLOListElement>(null);
  const leavingList = useRef<HTMLOListElement>(null);

  // What changed is worked out while rendering, as in Trick: the chien leaving is drawn in the
  // same frame as what replaces it.
  const [previous, setPrevious] = useState<{ key: string; chien: ChienOnTable | null } | null>(
    null,
  );
  const [motion, setMotion] = useState<Motion>({ turned: false, leaving: null });
  if (previous?.key !== key) {
    const before = previous?.chien ?? null;
    setPrevious({ key, chien });
    setMotion({
      turned: before !== null && !before.faceUp && chien?.faceUp === true,
      leaving:
        before !== null && chien === null && leavesTo !== 'hand'
          ? { chien: before, to: leavesTo }
          : null,
    });
  }

  useLayoutEffect(() => {
    const root = list.current;
    if (!root) return;
    // The middle card: where the taker's hand takes the chien from.
    const slots = [...root.children] as HTMLElement[];
    const middle = slots[Math.floor(slots.length / 2)];
    if (middle) rememberChienBox(layoutBox(middle));
    if (motion.turned) slots.forEach((slot, i) => turnOver(slot, i * 40));
  }, [key, motion.turned]);

  const leaving = motion.leaving;
  useLayoutEffect(() => {
    const root = leavingList.current;
    if (!root || !leaving) return;
    let mounted = true;
    const done = () => {
      if (mounted) setMotion((m) => (m.leaving === leaving ? { ...m, leaving: null } : m));
    };
    const target = leaving.to === null ? null : seatBox(leaving.to);
    const flights = [...root.children].map((el) => flyOut(el, target));
    if (flights.some((f) => f === null)) {
      done();
      return;
    }
    void Promise.all(flights.map((f) => f?.finished)).then(done, done);
    return () => {
      mounted = false;
      flights.forEach((f) => f?.cancel());
    };
  }, [leaving]);

  if (chien === null && leaving === null) return null;
  return (
    <figure className={styles.chien}>
      {chien && (
        <ol ref={list} className={styles.cards} role="group" aria-label={fr.table.chien}>
          <Cards chien={chien} />
        </ol>
      )}
      {leaving && (
        <ol ref={leavingList} className={styles.cards} aria-hidden data-leaving="">
          <Cards chien={leaving.chien} />
        </ol>
      )}
      {chien && <figcaption className={styles.caption}>{fr.table.chien}</figcaption>}
    </figure>
  );
}
