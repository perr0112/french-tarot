import type { Seat } from '@tarot/engine';
import type { ThrowItem } from '@tarot/protocol';
import { useCallback, useEffect, useRef, useState } from 'react';

/** How long a throw lives on screen: its flight, then its mark on the target. */
export const THROW_SHOWN_MS = 4200;

export interface Throw {
  readonly id: number;
  readonly from: Seat;
  readonly to: Seat;
  readonly item: ThrowItem;
}

/** The throws in the air or on their target (AGENTS.md §6), each for THROW_SHOWN_MS. */
export function useThrows(): {
  readonly active: readonly Throw[];
  readonly add: (from: Seat, to: Seat, item: ThrowItem) => void;
} {
  const [active, setActive] = useState<readonly Throw[]>([]);
  const next = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const add = useCallback((from: Seat, to: Seat, item: ThrowItem) => {
    const id = ++next.current;
    setActive((current) => [...current, { id, from, to, item }]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setActive((current) => current.filter((t) => t.id !== id));
    }, THROW_SHOWN_MS);
    timers.current.add(timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return { active, add };
}
