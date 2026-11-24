import { useSyncExternalStore } from 'react';

/** A media query's answer, following it as it changes (none outside a browser). */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (listener) => {
      const list = window.matchMedia?.(query);
      list?.addEventListener('change', listener);
      return () => list?.removeEventListener('change', listener);
    },
    () => window.matchMedia?.(query).matches ?? false,
  );
}
