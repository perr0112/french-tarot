import { describe, expect, it } from 'vitest';
import { RoomHarness } from './testing/harness';

describe('joining a room', () => {
  it('makes the first participant the host, on seat 0, with a private token', () => {
    const h = new RoomHarness();
    const token = h.join('c1', 'Alice');
    expect(token).toBe('token-1');
    expect(h.view('c1').you).toEqual({ nickname: 'Alice', seat: 0, isHost: true });
    expect(h.view('c1').seats[0]).toEqual({
      kind: 'human',
      nickname: 'Alice',
      connected: true,
      replacedByBot: false,
    });
  });

  it('seats the next participants in order and updates everyone', () => {
    const h = new RoomHarness();
    h.join('c1', 'Alice');
    h.join('c2', 'Bob');
    expect(h.view('c2').you).toEqual({ nickname: 'Bob', seat: 1, isHost: false });
    expect(h.view('c1').seats[1]).toMatchObject({ kind: 'human', nickname: 'Bob' });
    expect(JSON.stringify(h.view('c1'))).not.toContain('token-2');
  });

  it('refuses a nickname already taken, whatever the case', () => {
    const h = new RoomHarness();
    h.join('c1', 'Alice');
    expect(h.join('c2', 'ALICE')).toBeNull();
    expect(h.lastError('c2')).toBe('NICKNAME_TAKEN');
  });

  it('refuses a second join on the same connection', () => {
    const h = new RoomHarness();
    h.join('c1', 'Alice');
    h.send('c1', { type: 'join', nickname: 'Again' });
    expect(h.lastError('c1')).toBe('ALREADY_JOINED');
  });

  it('refuses any other message before joining', () => {
    const h = new RoomHarness();
    h.send('c1', { type: 'start' });
    expect(h.lastError('c1')).toBe('NOT_JOINED');
  });
});

describe('reconnection', () => {
  it('gives the seat back to a returning token', () => {
    const h = new RoomHarness();
    const token = h.join('c1', 'Alice') ?? '';
    h.join('c2', 'Bob');
    h.disconnect('c1');
    expect(h.view('c2').seats[0]).toMatchObject({ connected: false });
    h.join('c3', 'ignored', token);
    expect(h.view('c3').you).toEqual({ nickname: 'Alice', seat: 0, isHost: true });
    expect(h.view('c2').seats[0]).toMatchObject({ nickname: 'Alice', connected: true });
  });

  it('moves a seat to the newest connection and closes the old one', () => {
    const h = new RoomHarness();
    const token = h.join('c1', 'Alice') ?? '';
    h.join('c2', 'Alice', token);
    expect(h.lastError('c1')).toBe('REPLACED_BY_NEW_CONNECTION');
    expect(h.closed.has('c1')).toBe(true);
    expect(h.view('c2').you.seat).toBe(0);
  });

  it('passes the host role to the first connected participant', () => {
    const h = new RoomHarness();
    h.join('c1', 'Alice');
    h.join('c2', 'Bob');
    h.disconnect('c1');
    expect(h.view('c2').you.isHost).toBe(true);
  });
});

describe('lobby settings', () => {
  it('lets only the host configure the room', () => {
    const h = new RoomHarness();
    h.join('c1', 'Alice');
    h.join('c2', 'Bob');
    h.send('c2', { type: 'configure', options: { deals: 4 } });
    expect(h.lastError('c2')).toBe('NOT_HOST');
    h.send('c1', { type: 'configure', options: { deals: 4, botSpeed: 'slow' } });
    expect(h.view('c2').options).toMatchObject({ players: 4, deals: 4, botSpeed: 'slow' });
  });

  it('moves humans without a seat to waiting, and back when seats appear', () => {
    const h = new RoomHarness();
    ['Alice', 'Bob', 'Carol', 'Dan'].forEach((name, i) => h.join(`c${i}`, name));
    h.send('c0', { type: 'configure', options: { players: 3 } });
    expect(h.view('c0').seats).toHaveLength(3);
    expect(h.view('c0').waiting).toEqual(['Dan']);
    expect(h.view('c3').you.seat).toBeNull();
    h.send('c0', { type: 'configure', options: { players: 5 } });
    expect(h.view('c3').you.seat).toBe(3);
    expect(h.view('c0').waiting).toEqual([]);
  });

  it('seats bots on empty seats only', () => {
    const h = new RoomHarness();
    h.join('c1', 'Alice');
    h.send('c1', { type: 'setBot', seat: 2, level: 'easy' });
    expect(h.view('c1').seats[2]).toEqual({ kind: 'bot', level: 'easy' });
    h.send('c1', { type: 'setBot', seat: 0, level: 'medium' });
    expect(h.lastError('c1')).toBe('SEAT_TAKEN');
    h.send('c1', { type: 'setBot', seat: 4, level: 'medium' });
    expect(h.lastError('c1')).toBe('SEAT_INVALID');
    h.send('c1', { type: 'setBot', seat: 2, level: null });
    expect(h.view('c1').seats[2]).toEqual({ kind: 'empty' });
  });

  it('gives a freed seat to a waiting participant', () => {
    const h = new RoomHarness();
    h.join('c1', 'Alice');
    h.send('c1', { type: 'configure', options: { players: 3 } });
    h.send('c1', { type: 'setBot', seat: 1, level: 'medium' });
    h.send('c1', { type: 'setBot', seat: 2, level: 'medium' });
    h.join('c2', 'Bob');
    expect(h.view('c2').you.seat).toBeNull();
    h.send('c1', { type: 'setBot', seat: 1, level: null });
    expect(h.view('c2').you.seat).toBe(1);
  });

  it('refuses newcomers once the session has started', () => {
    const h = new RoomHarness();
    h.join('c1', 'Alice');
    [1, 2, 3].forEach((seat) => h.send('c1', { type: 'setBot', seat, level: 'medium' }));
    h.send('c1', { type: 'start' });
    expect(h.join('c2', 'Bob')).toBeNull();
    expect(h.lastError('c2')).toBe('GAME_IN_PROGRESS');
    expect(h.closed.has('c2')).toBe(true);
  });
});
