import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setAnimations, setThemePreference } from '../lib/theme';
import { SEASON_THEMES } from '../themes/seasons';
import { SeasonalAmbience } from './SeasonalAmbience';

const drifting = () => document.querySelectorAll('[data-drift]');

function mediaQueries(matches: (query: string) => boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matches(query),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('SeasonalAmbience', () => {
  afterEach(() => {
    setThemePreference('auto');
    setAnimations(true);
    vi.unstubAllGlobals();
  });

  it('lets the season’s things drift behind the page, hidden from screen readers', () => {
    mediaQueries(() => false);
    setThemePreference('winter');
    render(<SeasonalAmbience />);
    expect(drifting()).toHaveLength(SEASON_THEMES.winter.drift.count);
    expect(drifting()[0]?.closest('[aria-hidden="true"]')).toBeTruthy();
  });

  it('shows half as many on a phone', () => {
    mediaQueries((query) => query.includes('max-width'));
    setThemePreference('winter');
    render(<SeasonalAmbience />);
    expect(drifting()).toHaveLength(SEASON_THEMES.winter.drift.count / 2);
  });

  it('shows nothing when the player turned them off, or the system asks for less motion', () => {
    mediaQueries(() => false);
    setAnimations(false);
    const { unmount } = render(<SeasonalAmbience />);
    expect(drifting()).toHaveLength(0);
    unmount();
    setAnimations(true);
    mediaQueries((query) => query.includes('reduce'));
    render(<SeasonalAmbience />);
    expect(drifting()).toHaveLength(0);
  });
});
