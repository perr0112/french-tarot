import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setThemePreference } from '../lib/theme';
import { SEASONS } from '../themes/seasons';
import { Scenery } from './Scenery';

describe('Scenery', () => {
  afterEach(() => setThemePreference('auto'));

  it.each(SEASONS)(
    'draws the %s landscape behind the page, hidden from screen readers',
    (season) => {
      setThemePreference(season);
      render(<Scenery />);
      const scene = document.querySelector(`[data-scene='${season}']`);
      expect(scene).toBeTruthy();
      expect(scene?.closest('[aria-hidden="true"]')).toBeTruthy();
    },
  );

  it('keeps a plain sky where the shader cannot run', async () => {
    setThemePreference('winter');
    render(<Scenery />);
    await waitFor(() => expect(document.querySelector('[data-sky="fallback"]')).toBeTruthy());
  });
});
