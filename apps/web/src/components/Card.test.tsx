import { ALL_CARDS } from '@tarot/engine';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { cardName } from '../lib/cards';
import { CardBack, CardFace } from './Card';

/** A card's drawing, without its accessible name. */
const drawing = (element: React.ReactElement) =>
  renderToStaticMarkup(element).replace(/aria-label="[^"]*"/, '');

describe('card faces', () => {
  it('draws the 78 cards all differently', () => {
    const drawings = new Set(ALL_CARDS.map((card) => drawing(<CardFace card={card} />)));
    expect(drawings.size).toBe(78);
  });

  it('draws the 78 mini cards all differently, with the same names', () => {
    const drawings = new Set(
      ALL_CARDS.map((card) => drawing(<CardFace card={card} size="mini" />)),
    );
    expect(drawings.size).toBe(78);
    for (const card of ALL_CARDS) {
      const { unmount } = render(<CardFace card={card} size="mini" />);
      expect(screen.getByRole('img', { name: cardName(card) })).toBeTruthy();
      unmount();
    }
  });

  it('names every card for screen readers', () => {
    for (const card of ALL_CARDS) {
      const { unmount } = render(<CardFace card={card} />);
      expect(screen.getByRole('img', { name: cardName(card) })).toBeTruthy();
      unmount();
    }
  });
});

describe('card back', () => {
  it('is named as a hidden card and tells nothing else', () => {
    render(<CardBack />);
    expect(screen.getByRole('img', { name: 'Carte cachée' })).toBeTruthy();
    expect(drawing(<CardBack />)).not.toMatch(/[SHDCT]\d\d|EXC/);
  });
});
