import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { roomView } from '../testing/views';
import { Lobby } from './Lobby';

const lobbyView = (isHost: boolean) =>
  roomView(null, isHost ? 0 : 2, {
    phase: 'lobby',
    session: null,
    seats: [
      { kind: 'human', nickname: 'Alice', connected: true, replacedByBot: false },
      { kind: 'empty' },
      { kind: 'human', nickname: 'Bob', connected: true, replacedByBot: false },
      { kind: 'bot', level: 'easy' },
    ],
  });

describe('Lobby', () => {
  it('lets the host seat a bot and change the options', () => {
    const send = vi.fn();
    render(<Lobby view={lobbyView(true)} send={send} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un bot' }));
    expect(send).toHaveBeenCalledWith({ type: 'setBot', seat: 1, level: 'medium' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Siège 4' }), {
      target: { value: 'hard' },
    });
    expect(send).toHaveBeenCalledWith({ type: 'setBot', seat: 3, level: 'hard' });
    expect(screen.getByRole('option', { name: 'Jade 1 · Difficile' })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Joueurs' }), { target: { value: '5' } });
    expect(send).toHaveBeenCalledWith({ type: 'configure', options: { players: 5 } });
    expect(screen.getByRole('button', { name: 'Lancer la partie' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('shows the settings read-only to the other players', () => {
    render(<Lobby view={lobbyView(false)} send={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Ajouter un bot' })).toBeNull();
    // Disabled through its fieldset.
    expect(screen.getByRole('combobox', { name: 'Joueurs' }).matches(':disabled')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Lancer la partie' })).toBeNull();
  });
});
