import type { Card, PlayedCard } from '@tarot/engine';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SeatPosition } from '../lib/seats';
import { Trick } from './Trick';

const positions: SeatPosition[] = ['bottom', 'right', 'top', 'left'];
const played = (...cards: [number, string][]): PlayedCard[] =>
  cards.map(([seat, card]) => ({ seat, card: card as Card }));
const completed = played([1, 'S01'], [2, 'S07'], [3, 'S09'], [0, 'T02']);

const trick = (cards: PlayedCard[], winner: number | null, animated = true) => (
  <Trick
    cards={cards}
    winner={winner}
    positions={positions}
    me={0}
    label="Pli"
    animated={animated}
  />
);
const shownCards = () => screen.getAllByRole('img').map((img) => img.getAttribute('aria-label'));

describe('Trick', () => {
  it('shows the next trick once the completed one is collected (no animation API here)', () => {
    const { rerender } = render(trick(completed, 0));
    rerender(trick(played([0, 'H14']), null));
    // Without the Web Animations API the collected cards leave at once.
    expect(shownCards()).toEqual(['Roi de cœur']);
    expect(document.querySelectorAll('[data-collecting]')).toHaveLength(0);
  });

  it('shows the cards as they are while looking back', () => {
    const { rerender } = render(trick(played([1, 'S01']), null));
    rerender(trick(completed, 0, false));
    expect(shownCards()).toHaveLength(4);
  });
});
