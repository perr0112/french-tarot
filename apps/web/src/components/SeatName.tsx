import type { Seat } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import { useEffect, useState } from 'react';
import { useMedia } from '../lib/media';
import { seatName } from '../lib/names';
import styles from './SeatName.module.css';

/** How often a hacker's name changes its letters. */
export const HACKER_TICK_MS = 60;

// ASCII only: one character's width each, so the name never changes size.
const GLYPHS = '01#%&@$*+=<>/\\|{}[]?!';

/** Ticks a letter stays scrambled before the next one settles, and the pause once it reads. */
const SETTLE_TICKS = 2;
const HOLD_TICKS = 18;

/** The name at `tick`: its first letters settled, the others random glyphs (or all of it). */
function scramble(name: string, tick: number): string {
  const letters = [...name];
  const cycle = letters.length * SETTLE_TICKS + HOLD_TICKS;
  const settled = Math.floor((tick % cycle) / SETTLE_TICKS);
  return letters
    .map((letter, i) =>
      i < settled || letter === ' '
        ? letter
        : (GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? letter),
    )
    .join('');
}

/** A hacker's name: its letters scramble and settle, again and again, in a terminal's green. */
function HackerName({ name }: { name: string }) {
  const still = useMedia('(prefers-reduced-motion: reduce)');
  const [shown, setShown] = useState(name);
  useEffect(() => {
    if (still) return;
    let tick = 0;
    const timer = setInterval(() => setShown(scramble(name, ++tick)), HACKER_TICK_MS);
    return () => clearInterval(timer);
  }, [name, still]);
  return (
    // Read as the name itself, whatever the letters show.
    <span
      className={styles.hacker}
      role="img"
      aria-label={name}
      style={{ width: `${[...name].length}ch` }}
    >
      {still ? name : shown}
    </span>
  );
}

/**
 * A seat's name on screen (lib/names.ts): a hacker's scrambles like a terminal's, the player
 * having typed `tarot.hacker()` in the console (AGENTS.md §6).
 */
export function SeatName({ view, seat }: { view: RoomView; seat: Seat }) {
  const occupant = view.seats[seat];
  const name = seatName(view, seat);
  return occupant?.kind === 'human' && occupant.hacker ? <HackerName name={name} /> : <>{name}</>;
}
