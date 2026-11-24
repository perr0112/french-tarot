import { afterEach, describe, expect, it } from 'vitest';
import {
  activeSeason,
  animationsOn,
  applyTheme,
  seasonOf,
  setAnimations,
  setThemePreference,
  themePreference,
} from './theme';

describe('seasonOf', () => {
  it('follows the meteorological seasons', () => {
    const month = (m: number) => seasonOf(new Date(2026, m, 15));
    expect([0, 1, 2, 4, 5, 7, 8, 10, 11].map(month)).toEqual([
      'winter',
      'winter',
      'spring',
      'spring',
      'summer',
      'summer',
      'autumn',
      'autumn',
      'winter',
    ]);
  });
});

describe('the theme', () => {
  afterEach(() => setThemePreference('auto'));

  it('follows the date by default, or the season the player picked, kept for next time', () => {
    applyTheme(new Date(2026, 6, 1));
    expect(document.documentElement.dataset.season).toBe('summer');
    setThemePreference('winter');
    expect(document.documentElement.dataset.season).toBe('winter');
    expect(themePreference()).toBe('winter');
    expect(localStorage.getItem('tarot.theme')).toBe('winter');
  });
});

describe('the season shown', () => {
  afterEach(() => setThemePreference('auto'));

  it('is the one picked, else the season of the day', () => {
    setThemePreference('spring');
    expect(activeSeason()).toBe('spring');
    setThemePreference('auto');
    expect(activeSeason(new Date(2026, 0, 10))).toBe('winter');
  });
});

describe('the animations', () => {
  afterEach(() => setAnimations(true));

  it('are on unless the player turned them off, kept for next time', () => {
    expect(animationsOn()).toBe(true);
    setAnimations(false);
    expect(animationsOn()).toBe(false);
    expect(localStorage.getItem('tarot.animations')).toBe('off');
  });
});
