import { describe, expect, it } from 'vitest';
import { parseClientMessage } from './index';

const ok = (raw: unknown) => {
  const result = parseClientMessage(raw);
  if (!result.ok) throw new Error('expected a valid message');
  return result.message;
};

describe('parseClientMessage', () => {
  it('accepts a join, trimming the nickname', () => {
    expect(ok({ type: 'join', nickname: '  Alice ' })).toEqual({ type: 'join', nickname: 'Alice' });
    expect(ok({ type: 'join', nickname: 'Bob', token: 'abc' })).toEqual({
      type: 'join',
      nickname: 'Bob',
      token: 'abc',
    });
  });

  it('parses a JSON string as received from a socket', () => {
    expect(ok('{"type":"start"}')).toEqual({ type: 'start' });
  });

  it.each([
    ['an empty nickname', { type: 'join', nickname: '   ' }],
    ['a nickname over 20 characters', { type: 'join', nickname: 'x'.repeat(21) }],
    ['an unknown type', { type: 'hack' }],
    ['malformed JSON', '{"type":'],
    ['a non-object', 42],
    ['an unknown card', { type: 'action', action: { type: 'playCard', card: 'S15' } }],
    ['an unknown contract', { type: 'action', action: { type: 'bid', contract: 'prise' } }],
    ['a bot level that does not exist', { type: 'setBot', seat: 1, level: 'expert' }],
    ['a deal count of zero', { type: 'configure', options: { deals: 0 } }],
    ['an unsupported player count', { type: 'configure', options: { players: 6 } }],
  ])('rejects %s', (_, raw) => {
    expect(parseClientMessage(raw)).toEqual({ ok: false, error: { code: 'INVALID_MESSAGE' } });
  });

  it('accepts every engine action', () => {
    expect(ok({ type: 'action', action: { type: 'bid', contract: 'gardeSans' } })).toEqual({
      type: 'action',
      action: { type: 'bid', contract: 'gardeSans' },
    });
    expect(ok({ type: 'action', action: { type: 'callKing', card: 'H14' } })).toMatchObject({
      action: { type: 'callKing', card: 'H14' },
    });
    expect(
      ok({ type: 'action', action: { type: 'ecart', cards: ['S02', 'S03', 'S04'] } }),
    ).toMatchObject({ action: { type: 'ecart', cards: ['S02', 'S03', 'S04'] } });
    expect(ok({ type: 'action', action: { type: 'decideChelem', announce: true } })).toMatchObject({
      action: { type: 'decideChelem', announce: true },
    });
    expect(ok({ type: 'action', action: { type: 'playCard', card: 'EXC' } })).toEqual({
      type: 'action',
      action: { type: 'playCard', card: 'EXC' },
    });
    expect(
      ok({ type: 'action', action: { type: 'playCard', card: 'T01', poignee: ['T02', 'T03'] } }),
    ).toMatchObject({ action: { poignee: ['T02', 'T03'] } });
  });

  it('accepts the host and lobby messages', () => {
    expect(ok({ type: 'configure', options: { players: 5, deals: 12, botSpeed: 'fast' } })).toEqual(
      { type: 'configure', options: { players: 5, deals: 12, botSpeed: 'fast' } },
    );
    expect(ok({ type: 'setBot', seat: 2, level: null })).toEqual({
      type: 'setBot',
      seat: 2,
      level: null,
    });
    for (const type of ['start', 'continue', 'newSession', 'backToLobby']) {
      expect(ok({ type })).toEqual({ type });
    }
  });
});

describe('reactions', () => {
  it('accepts the six reactions only', () => {
    expect(parseClientMessage({ type: 'react', emoji: '😂' })).toEqual({
      ok: true,
      message: { type: 'react', emoji: '😂' },
    });
    expect(parseClientMessage({ type: 'react', emoji: '💩' }).ok).toBe(false);
  });
});

describe('throws and the hacker name', () => {
  it('accepts the six things to throw only, and the hacker toggle', () => {
    expect(parseClientMessage({ type: 'throw', target: 1, item: 'cake' }).ok).toBe(true);
    expect(parseClientMessage({ type: 'throw', target: 1, item: 'brick' }).ok).toBe(false);
    expect(parseClientMessage({ type: 'hacker' })).toEqual({
      ok: true,
      message: { type: 'hacker' },
    });
  });
});
