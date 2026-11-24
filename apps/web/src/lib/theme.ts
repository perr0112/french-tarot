import { useSyncExternalStore } from 'react';
import { SEASONS, type Season } from '../design/tokens';

/** The theme a player chose: the season of the day, or one season always. */
export type ThemePreference = 'auto' | Season;

const KEY = 'tarot.theme';

/** The meteorological season of a date: spring is March to May, and so on. */
export function seasonOf(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'auto' || SEASONS.includes(value as Season);

function stored(): ThemePreference {
  try {
    const value = localStorage.getItem(KEY);
    return isPreference(value) ? value : 'auto';
  } catch {
    return 'auto';
  }
}

let preference: ThemePreference = stored();
const listeners = new Set<() => void>();

export const themePreference = (): ThemePreference => preference;

/** Puts the season's theme on the page (tokens.ts: `:root[data-season]`). */
export function applyTheme(now: Date = new Date()): void {
  document.documentElement.dataset.season = preference === 'auto' ? seasonOf(now) : preference;
}

/** This browser's choice (each player their own; the room never knows it). */
export function setThemePreference(next: ThemePreference): void {
  preference = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Private browsing: the choice lasts this visit only.
  }
  applyTheme();
  listeners.forEach((listener) => listener());
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, themePreference);
}
