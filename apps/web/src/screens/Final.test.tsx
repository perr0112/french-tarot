import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { roomView } from '../testing/views';
import { Final } from './Final';

describe('final ranking', () => {
  it('still explains the last deal, with no way to continue', () => {
    const view = roomView(null, 0, {
      phase: 'finished',
      session: {
        deals: 1,
        played: 1,
        dealer: 0,
        totals: [0, 0, 0, 0],
        history: [{ dealer: 3, result: null, cancelled: { reason: 'allPassed' } }],
        continued: null,
      },
    });
    render(<Final view={view} send={vi.fn()} />);
    expect(screen.getByText('Tout le monde a passé.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continuer' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Nouvelle partie' })).toBeTruthy();
  });
});
