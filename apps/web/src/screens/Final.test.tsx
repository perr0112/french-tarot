import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { cardName } from '../lib/cards';
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
    expect(screen.getByRole('button', { name: 'Rejouer' })).toBeTruthy();
  });

  const ended = (totals: number[]) =>
    roomView(null, 0, {
      phase: 'finished',
      session: {
        deals: 1,
        played: 1,
        dealer: 0,
        totals,
        history: [{ dealer: 3, result: null, cancelled: { reason: 'allPassed' } }],
        continued: null,
      },
    });
  const podium = () =>
    within(screen.getByRole('list', { name: 'Classement' }))
      .getAllByRole('listitem')
      .map((item) => within(item).getByRole('img').getAttribute('aria-label'));

  it('names the winner and lays a card by rank: the 21 first, the Excuse last', () => {
    render(<Final view={ended([-60, 90, 30, -60])} send={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Jade 1 remporte la partie' })).toBeTruthy();
    expect(podium()).toEqual((['T21', 'T20', 'EXC', 'EXC'] as const).map(cardName));
  });

  it('lets every player accept to play again, naming who is still awaited', () => {
    const send = vi.fn();
    // Bob (seat 2) sees the button too, not only the host.
    const view = { ...ended([0, 0, 0, 0]), you: { nickname: 'Bob', seat: 2, isHost: false } };
    const { rerender } = render(<Final view={{ ...view, replayReady: [] }} send={send} />);
    screen.getByRole('button', { name: 'Rejouer' }).click();
    expect(send).toHaveBeenCalledWith({ type: 'newSession' });
    expect(screen.queryByRole('button', { name: 'Retour au salon' })).toBeNull();
    rerender(<Final view={{ ...view, replayReady: [2] }} send={send} />);
    expect(screen.getByRole('button', { name: 'Prêt' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('En attente de : Alice')).toBeTruthy();
  });

  it('names every winner of a tie', () => {
    render(<Final view={ended([90, 90, -90, -90])} send={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Égalité entre Alice et Jade 1' })).toBeTruthy();
  });
});
