import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { roomView } from '../testing/views';
import { HACKER_TICK_MS, SeatName } from './SeatName';

describe('SeatName', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const view = (hacker: boolean) =>
    roomView(null, 0, {
      seats: [
        {
          kind: 'human',
          nickname: 'Alice',
          connected: true,
          replacedByBot: false,
          autoplay: false,
          hacker,
        },
        { kind: 'bot', level: 'medium', number: 1 },
        { kind: 'bot', level: 'medium', number: 2 },
        { kind: 'bot', level: 'easy', number: 3 },
      ],
    });

  it('shows the name as it is, usually', () => {
    render(<SeatName view={view(false)} seat={0} />);
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('scrambles a hacker’s name, letter by letter, yet reads it whole', () => {
    render(<SeatName view={view(true)} seat={0} />);
    const name = screen.getByRole('img', { name: 'Alice' });
    act(() => vi.advanceTimersByTime(HACKER_TICK_MS));
    const scrambled = name.textContent ?? '';
    expect(scrambled).toHaveLength(5);
    expect(scrambled).not.toBe('Alice');
    // It settles back on the real name, then scrambles again.
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      act(() => vi.advanceTimersByTime(HACKER_TICK_MS));
      seen.add(name.textContent ?? '');
    }
    expect(seen.has('Alice')).toBe(true);
  });
});
