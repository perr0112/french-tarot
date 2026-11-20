import type { PlayerView, Seat } from '@tarot/engine';
import { useEffect, useState } from 'react';
import { DURATION } from '../motion/animate';

/** How long a poignée stays shown at its seat once declared. */
export const POIGNEE_SHOWN_MS = 5000;

/** How a seat's poignée is shown: in full, fading out, or no longer. */
export type PoigneeShowing = 'shown' | 'fading';

/** When each poignée of the deal was first seen here, or 'before' if already there on arrival. */
type Seen = Readonly<Record<string, number | 'before'>>;

const keyOf = (deal: number, seat: Seat) => `${deal}:${seat}`;

/**
 * The poignées to show at their seats (AGENTS.md §6): each for POIGNEE_SHOWN_MS after it is
 * declared, then fading out. One already declared when this page opened is not shown again; it
 * still counts in the deal's breakdown.
 */
export function useFreshPoignees(
  deal: PlayerView | null,
  dealNumber: number,
): ReadonlyMap<Seat, PoigneeShowing> {
  const keys = (deal?.poignees ?? []).map((p) => keyOf(dealNumber, p.seat));
  const [seen, setSeen] = useState<Seen>(() =>
    Object.fromEntries(keys.map((key) => [key, 'before'])),
  );
  const [now, setNow] = useState(() => Date.now());
  // The poignées just declared, as one string so the effect runs once per change.
  const missing = keys.filter((key) => !(key in seen)).join(' ');

  // Noted on the next tick: until then, a poignée just declared counts as shown (below).
  useEffect(() => {
    if (missing === '') return;
    const timer = setTimeout(() => {
      const at = Date.now();
      setSeen((s) => ({ ...s, ...Object.fromEntries(missing.split(' ').map((key) => [key, at])) }));
      setNow(at);
    }, 0);
    return () => clearTimeout(timer);
  }, [missing]);

  // Wakes up when the next poignée starts fading, or is gone.
  const times = Object.values(seen).filter((t) => typeof t === 'number');
  const next = times
    .flatMap((t) => [t + POIGNEE_SHOWN_MS, t + POIGNEE_SHOWN_MS + DURATION.base])
    .filter((t) => t > now)
    .sort((a, b) => a - b)[0];
  useEffect(() => {
    if (next === undefined) return;
    const timer = setTimeout(() => setNow(Date.now()), next - Date.now());
    return () => clearTimeout(timer);
  }, [next]);

  const showing = new Map<Seat, PoigneeShowing>();
  for (const p of deal?.poignees ?? []) {
    const t = seen[keyOf(dealNumber, p.seat)];
    if (t === undefined) showing.set(p.seat, 'shown');
    if (typeof t !== 'number') continue;
    if (now < t + POIGNEE_SHOWN_MS) showing.set(p.seat, 'shown');
    else if (now < t + POIGNEE_SHOWN_MS + DURATION.base) showing.set(p.seat, 'fading');
  }
  return showing;
}
