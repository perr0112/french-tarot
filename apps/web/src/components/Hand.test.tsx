import { ALL_CARDS } from '@tarot/engine';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Hand } from './Hand';

const cards = ALL_CARDS.slice(0, 18);

describe('Hand', () => {
  it('can be played as soon as it is dealt in (no animation API here)', () => {
    const onPick = vi.fn();
    const added = vi.spyOn(window, 'addEventListener');
    render(<Hand cards={cards} active={cards} onPick={onPick} dealing={{ key: '0', from: 1 }} />);
    fireEvent.click(screen.getByRole('button', { name: '1 de pique' }));
    expect(onPick).toHaveBeenCalledWith('S01');
    // Nothing flew, so nothing waits for a click or a key to skip it.
    expect(added.mock.calls.some(([event]) => event === 'pointerdown')).toBe(false);
    added.mockRestore();
  });
});
