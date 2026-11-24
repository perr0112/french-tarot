import { afterEach, describe, expect, it } from 'vitest';
import { applyTheme, seasonOf, setThemePreference, themePreference } from './theme';

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
