import { useSyncExternalStore } from 'react';
import { SEASONS, type Season } from '../themes/seasons';

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

/** The season shown: the one the player picked, else the season of the day. */
export const activeSeason = (now: Date = new Date()): Season =>
  preference === 'auto' ? seasonOf(now) : preference;

/** Puts the season's theme on the page (tokens.ts: `:root[data-season]`). */
export function applyTheme(now: Date = new Date()): void {
  document.documentElement.dataset.season = activeSeason(now);
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

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, themePreference);
}

/** The season shown, following the player's choice as it changes. */
export function useSeason(): Season {
  return useSyncExternalStore(subscribe, () => activeSeason());
}

// ---------------------------------------------------------------- animations

const ANIMATIONS_KEY = 'tarot.animations';

function storedAnimations(): boolean {
  try {
    return localStorage.getItem(ANIMATIONS_KEY) !== 'off';
  } catch {
    return true;
  }
}

let animations = storedAnimations();

/** Whether the seasons' drifting decorations are on (the player's choice, on by default). */
export const animationsOn = (): boolean => animations;

export function setAnimations(on: boolean): void {
  animations = on;
  try {
    localStorage.setItem(ANIMATIONS_KEY, on ? 'on' : 'off');
  } catch {
    // Private browsing: the choice lasts this visit only.
  }
  listeners.forEach((listener) => listener());
}

export function useAnimations(): boolean {
  return useSyncExternalStore(subscribe, animationsOn);
}
