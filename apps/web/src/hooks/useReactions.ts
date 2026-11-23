import type { Seat } from '@tarot/engine';
import type { Reaction } from '@tarot/protocol';
import { useCallback, useEffect, useRef, useState } from 'react';

/** How long a reaction stays shown at its seat. */
export const REACTION_SHOWN_MS = 3000;

export interface ShownReaction {
  readonly emoji: Reaction;
  /** Tells two equal reactions in a row apart, so each one pops anew. */
  readonly id: number;
}

/** The reactions shown at the seats (AGENTS.md §6): each seat's latest, for REACTION_SHOWN_MS. */
export function useReactions(): {
  readonly shown: ReadonlyMap<Seat, ShownReaction>;
  readonly add: (seat: Seat, emoji: Reaction) => void;
} {
  const [shown, setShown] = useState<ReadonlyMap<Seat, ShownReaction>>(new Map());
  const next = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const add = useCallback((seat: Seat, emoji: Reaction) => {
    const id = ++next.current;
    setShown((current) => new Map(current).set(seat, { emoji, id }));
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      // Only if no newer reaction took its place.
      setShown((current) => {
        if (current.get(seat)?.id !== id) return current;
        const without = new Map(current);
        without.delete(seat);
        return without;
      });
    }, REACTION_SHOWN_MS);
    timers.current.add(timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return { shown, add };
}
