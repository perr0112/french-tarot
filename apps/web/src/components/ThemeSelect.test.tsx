import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setThemePreference } from '../lib/theme';
import { ThemeSelect } from './ThemeSelect';

describe('ThemeSelect', () => {
  afterEach(() => setThemePreference('auto'));

  it('offers the season of the day or one of the four, and applies the choice', () => {
    render(<ThemeSelect />);
    const select = screen.getByRole('combobox', { name: 'Thème' });
    expect(
      [...(select as HTMLSelectElement).options].map((o) => o.textContent?.split(' (')[0]),
    ).toEqual(['Auto', 'Printemps', 'Été', 'Automne', 'Hiver']);
    fireEvent.change(select, { target: { value: 'spring' } });
    expect(document.documentElement.dataset.season).toBe('spring');
    expect((select as HTMLSelectElement).value).toBe('spring');
  });
});
