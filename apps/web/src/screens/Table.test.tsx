import { ALL_CARDS, createDeal, getPlayerView, isTrump, type Card } from '@tarot/engine';
import { fourKingsFifteenTrumps } from '@tarot/engine/testing';
import { DEFAULT_ROOM_OPTIONS, TRICK_PAUSE_MS } from '@tarot/protocol';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cardName } from '../lib/cards';
import { POIGNEE_SHOWN_MS } from '../hooks/useFreshPoignees';
import { PRESELECTION_DROPPED_MS } from '../hooks/usePreselection';
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
  it('lays out the four contracts in order, with their multiplier, and Passer apart below', () => {
    render(
      <Table view={roomView(dealWith([...suit('S', 1, 14), ...trumps(2, 5)]))} send={vi.fn()} />,
    );
    const contracts = within(screen.getByRole('group', { name: 'Contrats' }));
    expect(
      contracts.getAllByRole('button').map((b) => [b.getAttribute('aria-label'), b.textContent]),
    ).toEqual([
      ['Petite ×1', 'Petite×1'],
      ['Garde ×2', 'Garde×2'],
      ['Garde sans ×4', 'Garde sans×4'],
      ['Garde contre ×6', 'Garde contre×6'],
    ]);
    const pass = screen.getByRole('button', { name: 'Passer' });
    expect(contracts.queryByRole('button', { name: 'Passer' })).toBeNull();
    // Passer comes after every contract in the panel.
    const panel = screen.getByRole('region', { name: 'Votre enchère' });
    expect([...panel.querySelectorAll('button')].at(-1)).toBe(pass);
  });

  it('keeps the contracts already outbid in place, disabled', () => {
    // Seat 0 opened with a garde; seat 1 speaks next.
    const view = roomView(
      playOut(dealWith(trumps(1, 18)), [[0, { type: 'bid', contract: 'garde' }]]),
      1,
    );
    render(<Table view={view} send={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Petite ×1' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Garde ×2' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Garde sans ×4' })).toHaveProperty('disabled', false);
  });

  it('sends the chosen bid', () => {
    const send = vi.fn();
    render(<Table view={roomView(dealWith([...suit('S', 1, 14), ...trumps(2, 5)]))} send={send} />);
    click('Garde ×2');
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

  describe('a declared poignée', () => {
    const before = () =>
      playOut(takes(dealWith(hand), 'gardeSans'), [[0, { type: 'decideChelem', announce: false }]]);
    const after = () =>
      playOut(before(), [[0, { type: 'playCard', card: 'S03', poignee: trumps(1, 10) }]]);
    const shown = () => screen.queryByRole('group', { name: 'Poignée simple de Alice' });

    it('shows its trumps to the table for 5 s, then takes them away', () => {
      vi.useFakeTimers();
      try {
        const { rerender } = render(<Table view={roomView(before(), 1)} send={vi.fn()} />);
        rerender(<Table view={roomView(after(), 1)} send={vi.fn()} />);
        expect(within(shown() as HTMLElement).getAllByRole('img')).toHaveLength(10);
        act(() => vi.advanceTimersByTime(POIGNEE_SHOWN_MS - 1));
        expect(shown()).not.toBeNull();
        // It fades out, then goes.
        act(() => vi.advanceTimersByTime(1));
        act(() => vi.advanceTimersByTime(1000));
        expect(shown()).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it('is not shown again when the page opens after it', () => {
      render(<Table view={roomView(after(), 1)} send={vi.fn()} />);
      expect(shown()).toBeNull();
    });
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

describe('the end of a deal', () => {
  const lastTrick = {
    leader: 1,
    winner: 1,
    cards: [
      { seat: 1, card: 'S14' },
      { seat: 2, card: 'S02' },
      { seat: 3, card: 'S03' },
      { seat: 0, card: 'S04' },
    ],
  } as const;
  const finished = () => {
    const view = roomView(takes(dealWith([...trumps(1, 13), ...suit('S', 1, 5)]), 'garde'), 0, {
      session: {
        deals: 8,
        played: 1,
        dealer: 0,
        totals: [0, 0, 0, 0],
        history: [{ dealer: 3, result: null, cancelled: { reason: 'allPassed' } }],
        continued: [],
      },
    });
    const deal = view.deal && {
      ...view.deal,
      phase: 'finished' as const,
      currentTrick: null,
      lastTrick,
    };
    return { ...view, deal };
  };
  const result = () => screen.queryByText('Tout le monde a passé.');

  it('keeps the last trick shown for the usual pause, then shows the result', () => {
    vi.useFakeTimers();
    try {
      const playing = roomView(dealWith([...trumps(1, 13), ...suit('S', 1, 5)]));
      const { rerender } = render(<Table view={playing} send={vi.fn()} />);
      rerender(<Table view={finished()} send={vi.fn()} />);
      expect(result()).toBeNull();
      expect(screen.getByRole('img', { name: cardName('S04') })).toBeTruthy();
      act(() => vi.advanceTimersByTime(TRICK_PAUSE_MS));
      expect(result()).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the result at once when the page opens on it', () => {
    render(<Table view={finished()} send={vi.fn()} />);
    expect(result()).toBeTruthy();
  });
});

describe('between deals', () => {
  it('asks for the next deal and names who else is still awaited', () => {
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
    expect(screen.getByText('En attente de : Bob')).toBeTruthy();
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

  it('lies face down in the centre while the players bid', () => {
    render(<Table view={roomView(dealWith(hand), 1)} send={vi.fn()} />);
    expect(backs()).toHaveLength(6);
  });

  it.each(['gardeSans', 'gardeContre'] as const)('leaves the centre unseen in a %s', (contract) => {
    render(<Table view={roomView(takes(dealWith(hand), contract), 1)} send={vi.fn()} />);
    expect(screen.queryByRole('group', { name: 'Chien' })).toBeNull();
    expect(screen.queryAllByRole('img', { name: 'Carte cachée' })).toHaveLength(0);
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

  it.each(['petite', 'garde'] as const)('is shown face up to the others in a %s', (contract) => {
    const deal = takes(dealWith(hand), contract);
    render(<Table view={roomView(deal, 1)} send={vi.fn()} />);
    const shown = within(screen.getByRole('group', { name: 'Chien' })).getAllByRole('img');
    expect(shown.map((img) => img.getAttribute('aria-label'))).toEqual(deal.chien.map(cardName));
  });

  it('is in the taker’s hand, its cards marked, during the écart', () => {
    const deal = takes(dealWith(hand), 'garde');
    render(<Table view={roomView(deal)} send={vi.fn()} />);
    expect(screen.queryByRole('group', { name: 'Chien' })).toBeNull();
    for (const c of deal.chien) {
      expect(card(c).getAttribute('aria-description')).toBe('Vient du chien');
    }
    expect(card('S01').getAttribute('aria-description')).toBeNull();
  });

  it('is no longer shown once the deal is over', () => {
    const view = roomView(takes(dealWith(hand), 'gardeSans'), 1);
    const deal = view.deal && { ...view.deal, phase: 'finished' as const };
    render(<Table view={{ ...view, deal }} send={vi.fn()} />);
    expect(screen.queryByRole('group', { name: 'Chien' })).toBeNull();
  });
});

describe('a poignée with the trumps the taker had to discard', () => {
  it('offers them again, marked as lying in the écart', () => {
    const { deal, ecartTrump } = fourKingsFifteenTrumps();
    render(<Table view={roomView(deal)} send={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Déclarer une poignée' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Triple (15)' }));
    const chips = within(screen.getByRole('group', { name: 'Atouts montrés' }));
    const fromEcart = chips.getByRole('button', { name: cardName(ecartTrump) });
    expect(fromEcart.getAttribute('aria-description')).toBe("à l'écart");
    expect(chips.getAllByRole('button', { pressed: true })).toHaveLength(15);
  });
});

describe('leaving the table', () => {
  it('asks first, then leaves; staying keeps the game', () => {
    const onLeave = vi.fn();
    render(<Table view={roomView(dealWith(trumps(1, 18)))} send={vi.fn()} onLeave={onLeave} />);
    click('Quitter la table');
    expect(screen.getByText('Quitter la table ? Un bot prendra votre place.')).toBeTruthy();
    click('Rester');
    expect(onLeave).not.toHaveBeenCalled();
    click('Quitter la table');
    click('Quitter');
    expect(onLeave).toHaveBeenCalledOnce();
  });
});

describe('the scores', () => {
  const scored = () =>
    roomView(dealWith(trumps(1, 18)), 0, {
      session: {
        deals: 8,
        played: 1,
        dealer: 0,
        totals: [-60, 90, 30, -60],
        history: [{ dealer: 3, result: null, cancelled: { reason: 'allPassed' } }],
        continued: null,
      },
    });

  it('lie folded in a corner, best total first', () => {
    render(<Table view={scored()} send={vi.fn()} />);
    const totals = within(screen.getByRole('list', { name: 'Scores' }));
    expect(totals.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Bot 2+90',
      'Bob+30',
      'Alice−60',
      'Bot 4−60',
    ]);
  });

  it('unfold into the whole score sheet', () => {
    render(<Table view={scored()} send={vi.fn()} />);
    click('Feuille de marque');
    const sheet = screen.getByRole('region', { name: 'Feuille de marque' });
    expect(within(sheet).getByRole('table')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Replier' }).getAttribute('aria-expanded')).toBe(
      'true',
    );
  });
});

describe('the called King', () => {
  it('is shown at the taker’s seat', () => {
    const deal = playOut(createDeal({ players: 5, dealer: 0, seed: 11 }), [
      [1, { type: 'bid', contract: 'gardeSans' }],
      [2, { type: 'bid', contract: 'pass' }],
      [3, { type: 'bid', contract: 'pass' }],
      [4, { type: 'bid', contract: 'pass' }],
      [0, { type: 'bid', contract: 'pass' }],
      [1, { type: 'callKing', card: 'H14' }],
    ]);
    const seats = Array.from({ length: 5 }, () => ({
      kind: 'bot' as const,
      level: 'medium' as const,
    }));
    const options = { ...DEFAULT_ROOM_OPTIONS, players: 5 as const };
    render(<Table view={roomView(deal, 0, { seats, options })} send={vi.fn()} />);
    const taker = document.querySelector('[data-seat="1"]') as HTMLElement;
    expect(within(taker).getByRole('group', { name: 'Appel : Roi de cœur' })).toBeTruthy();
    expect(screen.queryByText('Appel : Roi de cœur')).toBeNull();
  });
});

describe('preselecting a card', () => {
  // Dealer 0: seat 1 leads the first trick, seat 0 (the taker) plays second.
  const waiting = (hand: readonly Card[]) =>
    playOut(dealWith(hand, 0), [
      [1, { type: 'bid', contract: 'pass' }],
      [2, { type: 'bid', contract: 'pass' }],
      [3, { type: 'bid', contract: 'pass' }],
      [0, { type: 'bid', contract: 'gardeSans' }],
      [0, { type: 'decideChelem', announce: false }],
    ]);
  // Seat 1 leads a spade; seat 2 has neither spades nor trumps, seat 3 must trump; then
  // seat 0's turn, who must follow spades.
  const spadesLed = (deal: ReturnType<typeof waiting>) => {
    const hands = [1, 2, 3].map((seat) => getPlayerView(deal, seat).hand);
    const pick = (seat: number, test: (c: Card) => boolean) => hands[seat - 1]?.find(test) ?? 'EXC';
    return playOut(deal, [
      [1, { type: 'playCard', card: pick(1, (c) => c.startsWith('S')) }],
      [2, { type: 'playCard', card: pick(2, (c) => c.startsWith('D')) }],
      [3, { type: 'playCard', card: pick(3, (c) => c.startsWith('T') && c !== 'T01') }],
    ]);
  };
  const plain: Card[] = [...suit('S', 1, 9), ...suit('H', 1, 9)];
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('plays the card at once when the turn comes and it may be played', () => {
    const send = vi.fn();
    const before = waiting(plain);
    const { rerender } = render(<Table view={roomView(before)} send={send} />);
    fireEvent.click(card('S03'));
    expect(send).not.toHaveBeenCalled();
    expect(card('S03').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Présélection : 3 de pique/)).toBeTruthy();
    rerender(<Table view={roomView(spadesLed(before))} send={send} />);
    act(() => vi.advanceTimersByTime(0));
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith({
      type: 'action',
      action: { type: 'playCard', card: 'S03' },
    });
  });

  it('is cancelled by clicking the card again, replaced by clicking another', () => {
    render(<Table view={roomView(waiting(plain))} send={vi.fn()} />);
    fireEvent.click(card('S03'));
    fireEvent.click(card('S03'));
    expect(card('S03').getAttribute('aria-pressed')).not.toBe('true');
    fireEvent.click(card('S03'));
    fireEvent.click(card('H05'));
    expect(card('S03').getAttribute('aria-pressed')).not.toBe('true');
    expect(card('H05').getAttribute('aria-pressed')).toBe('true');
  });

  it('is dropped, with a word why, when the card may not be played', () => {
    const send = vi.fn();
    const before = waiting(plain);
    const { rerender } = render(<Table view={roomView(before)} send={send} />);
    fireEvent.click(card('H05'));
    rerender(<Table view={roomView(spadesLed(before))} send={send} />);
    act(() => vi.advanceTimersByTime(0));
    expect(send).not.toHaveBeenCalled();
    expect(card('H05').getAttribute('aria-pressed')).not.toBe('true');
    expect(screen.getByText('Présélection retirée : carte non permise')).toBeTruthy();
    act(() => vi.advanceTimersByTime(PRESELECTION_DROPPED_MS));
    expect(screen.queryByText('Présélection retirée : carte non permise')).toBeNull();
  });

  it('waits for a click when a poignée may be declared with it', () => {
    const send = vi.fn();
    const before = waiting([...trumps(1, 13), ...suit('S', 1, 5)]);
    const { rerender } = render(<Table view={roomView(before)} send={send} />);
    fireEvent.click(card('S03'));
    rerender(<Table view={roomView(spadesLed(before))} send={send} />);
    act(() => vi.advanceTimersByTime(0));
    expect(send).not.toHaveBeenCalled();
    expect(card('S03').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(card('S03'));
    expect(send).toHaveBeenCalledWith({
      type: 'action',
      action: { type: 'playCard', card: 'S03' },
    });
  });

  it('is not offered while the players bid', () => {
    render(<Table view={roomView(dealWith(plain, 0))} send={vi.fn()} />);
    expect(card('S03')).toHaveProperty('disabled', true);
  });
});
