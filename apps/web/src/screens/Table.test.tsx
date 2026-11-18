import { ALL_CARDS, createDeal, isTrump, type Card } from '@tarot/engine';
import { DEFAULT_ROOM_OPTIONS } from '@tarot/protocol';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { cardName } from '../lib/cards';
import { dealWith, playOut, roomView, takes } from '../testing/views';
import { Table } from './Table';

const trumps = (from: number, to: number) =>
  ALL_CARDS.filter((c) => isTrump(c) && Number(c.slice(1)) >= from && Number(c.slice(1)) <= to);
const suit = (s: string, from: number, to: number) =>
  ALL_CARDS.filter(
    (c) => c.startsWith(s) && Number(c.slice(1)) >= from && Number(c.slice(1)) <= to,
  );

const card = (c: Card) => screen.getByRole('button', { name: cardName(c) });
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

describe('bidding', () => {
  it('sends the chosen bid', () => {
    const send = vi.fn();
    render(<Table view={roomView(dealWith([...suit('S', 1, 14), ...trumps(2, 5)]))} send={send} />);
    click('Garde');
    expect(send).toHaveBeenCalledWith({
      type: 'action',
      action: { type: 'bid', contract: 'garde' },
    });
  });
});

describe('écart', () => {
  // Seat 0 holds spades 1–9, five clubs and four trumps; garde takes the chien into the hand.
  const hand: Card[] = [...suit('S', 1, 9), ...suit('C', 1, 5), ...trumps(2, 5)];
  const ecartView = () => roomView(takes(dealWith(hand), 'garde'));

  it('enables the confirmation once six eligible cards are picked, then sends them', () => {
    const send = vi.fn();
    render(<Table view={ecartView()} send={send} />);
    const confirm = screen.getByRole('button', { name: "Valider l'écart" });
    const picks: Card[] = ['C01', 'C02', 'C03', 'C04', 'C05'];
    picks.forEach((c) => fireEvent.click(card(c)));
    expect(confirm).toHaveProperty('disabled', true);
    fireEvent.click(card('S02'));
    expect(confirm).toHaveProperty('disabled', false);
    fireEvent.click(confirm);
    expect(send).toHaveBeenCalledWith({
      type: 'action',
      action: { type: 'ecart', cards: [...picks, 'S02'] },
    });
  });

  it('does not let a King be picked', () => {
    render(<Table view={ecartView()} send={vi.fn()} />);
    const king = screen.queryByRole('button', { name: 'Roi de pique' });
    if (king) expect(king).toHaveProperty('disabled', true);
  });
});

describe('the first card', () => {
  // Thirteen trumps: a simple (10) or double (13) poignée in 4 players.
  const hand: Card[] = [...trumps(1, 13), ...suit('S', 1, 5)];
  const firstLead = () =>
    roomView(
      playOut(takes(dealWith(hand), 'gardeSans'), [[0, { type: 'decideChelem', announce: false }]]),
    );

  it('plays a card without a poignée by default', () => {
    const send = vi.fn();
    render(<Table view={firstLead()} send={send} />);
    fireEvent.click(card('S03'));
    expect(send).toHaveBeenCalledWith({
      type: 'action',
      action: { type: 'playCard', card: 'S03' },
    });
  });

  it('shows the ten weakest trumps once a poignée is declared', () => {
    const send = vi.fn();
    render(<Table view={firstLead()} send={send} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Déclarer une poignée' }));
    fireEvent.click(card('S03'));
    expect(send).toHaveBeenCalledWith({
      type: 'action',
      action: { type: 'playCard', card: 'S03', poignee: trumps(1, 10) },
    });
  });

  it('does not play while the trumps shown make no poignée', () => {
    const send = vi.fn();
    render(<Table view={firstLead()} send={send} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Déclarer une poignée' }));
    const shown = screen.getByRole('group', { name: 'Atouts montrés' });
    fireEvent.click(within(shown).getByRole('button', { name: 'Atout 5' }));
    expect(screen.getByText('Montrez exactement 10 ou 13 atouts.')).toBeTruthy();
    expect(card('S03')).toHaveProperty('disabled', true);
    fireEvent.click(card('S03'));
    expect(send).not.toHaveBeenCalled();
  });

  it('forgets a poignée chosen in the previous deal', () => {
    const send = vi.fn();
    const { rerender } = render(<Table view={firstLead()} send={send} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Déclarer une poignée' }));
    // Next deal: the same decision with as many cards, but other trumps.
    const other: Card[] = [...trumps(5, 16), ...suit('H', 1, 6)];
    const next = playOut(takes(dealWith(other), 'gardeSans'), [
      [0, { type: 'decideChelem', announce: false }],
    ]);
    const session = {
      deals: 8,
      played: 1,
      dealer: 3,
      totals: [0, 0, 0, 0],
      history: [{ dealer: 3, result: null, cancelled: { reason: 'allPassed' as const } }],
      continued: null,
    };
    rerender(<Table view={roomView(next, 0, { session })} send={send} />);
    fireEvent.click(card('H03'));
    expect(send).toHaveBeenCalledWith({
      type: 'action',
      action: { type: 'playCard', card: 'H03' },
    });
  });

  it('shows the trumps of a declared poignée to the table', () => {
    const played = playOut(takes(dealWith(hand), 'gardeSans'), [
      [0, { type: 'decideChelem', announce: false }],
      [0, { type: 'playCard', card: 'S03', poignee: trumps(1, 10) }],
    ]);
    render(<Table view={roomView(played, 1)} send={vi.fn()} />);
    const shown = screen.getByRole('group', { name: 'Poignée simple de Alice' });
    expect(within(shown).getAllByRole('img')).toHaveLength(10);
  });

  it('switches to a double poignée of all thirteen trumps', () => {
    const send = vi.fn();
    render(<Table view={firstLead()} send={send} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Déclarer une poignée' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Double (13)' }));
    fireEvent.click(card('S03'));
    expect(send).toHaveBeenCalledWith({
      type: 'action',
      action: { type: 'playCard', card: 'S03', poignee: trumps(1, 13) },
    });
  });
});

describe('chelem decision', () => {
  it('sends the announcement', () => {
    const send = vi.fn();
    const hand: Card[] = [...trumps(1, 13), ...suit('S', 1, 5)];
    render(<Table view={roomView(takes(dealWith(hand), 'gardeSans'))} send={send} />);
    click('Annoncer');
    expect(send).toHaveBeenCalledWith({
      type: 'action',
      action: { type: 'decideChelem', announce: true },
    });
  });
});

describe('between deals', () => {
  it('asks for the next deal and names who is still awaited', () => {
    const send = vi.fn();
    const view = roomView(null, 0, {
      session: {
        deals: 8,
        played: 0,
        dealer: 0,
        totals: [0, 0, 0, 0],
        history: [{ dealer: 3, result: null, cancelled: { reason: 'allPassed' } }],
        continued: [],
      },
    });
    render(<Table view={view} send={send} />);
    expect(screen.getByText('Tout le monde a passé.')).toBeTruthy();
    expect(screen.getByText('En attente de : Alice, Bob')).toBeTruthy();
    click('Continuer');
    expect(send).toHaveBeenCalledWith({ type: 'continue' });
  });
});

describe('the chien', () => {
  const hand: Card[] = [...trumps(1, 13), ...suit('S', 1, 5)];
  const backs = () =>
    within(screen.getByRole('group', { name: 'Chien' })).getAllByRole('img', {
      name: 'Carte cachée',
    });

  it.each(['gardeSans', 'gardeContre'] as const)('shows face down in a %s', (contract) => {
    render(<Table view={roomView(takes(dealWith(hand), contract), 1)} send={vi.fn()} />);
    expect(backs()).toHaveLength(6);
  });

  it('shows its three cards face down in 5 players', () => {
    const deal = playOut(createDeal({ players: 5, dealer: 0, seed: 11 }), [
      [1, { type: 'bid', contract: 'gardeSans' }],
      [2, { type: 'bid', contract: 'pass' }],
      [3, { type: 'bid', contract: 'pass' }],
      [4, { type: 'bid', contract: 'pass' }],
      [0, { type: 'bid', contract: 'pass' }],
    ]);
    const seats = Array.from({ length: 5 }, () => ({
      kind: 'bot' as const,
      level: 'medium' as const,
    }));
    const options = { ...DEFAULT_ROOM_OPTIONS, players: 5 as const };
    render(<Table view={roomView(deal, 0, { seats, options })} send={vi.fn()} />);
    expect(backs()).toHaveLength(3);
  });

  it.each(['petite', 'garde'] as const)('is never face down in a %s', (contract) => {
    render(<Table view={roomView(takes(dealWith(hand), contract), 1)} send={vi.fn()} />);
    expect(screen.queryAllByRole('img', { name: 'Carte cachée' })).toHaveLength(0);
  });

  it('is no longer shown once the deal is over', () => {
    const view = roomView(takes(dealWith(hand), 'gardeSans'), 1);
    const deal = view.deal && { ...view.deal, phase: 'finished' as const };
    render(<Table view={{ ...view, deal }} send={vi.fn()} />);
    expect(screen.queryByRole('group', { name: 'Chien' })).toBeNull();
  });
});
