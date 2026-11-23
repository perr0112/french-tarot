import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REACTION_SHOWN_MS, useReactions } from './useReactions';

describe('useReactions', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows each seat’s latest reaction for a few seconds', () => {
    const { result } = renderHook(() => useReactions());
    act(() => result.current.add(1, '😂'));
    act(() => vi.advanceTimersByTime(REACTION_SHOWN_MS / 2));
    act(() => result.current.add(1, '🎉'));
    act(() => result.current.add(2, '👏'));
    expect(result.current.shown.get(1)?.emoji).toBe('🎉');
    expect(result.current.shown.get(2)?.emoji).toBe('👏');
    // The first one's time is up, but a newer one stands at its seat.
    act(() => vi.advanceTimersByTime(REACTION_SHOWN_MS / 2));
    expect(result.current.shown.get(1)?.emoji).toBe('🎉');
    act(() => vi.advanceTimersByTime(REACTION_SHOWN_MS / 2));
    expect(result.current.shown.size).toBe(0);
  });
});
