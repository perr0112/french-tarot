import { describe, expect, it } from 'vitest';
import { isAllowedOrigin } from './origin';

const allowed = 'https://french-tarot.vercel.app, https://french-tarot-*-team.vercel.app';

describe('isAllowedOrigin', () => {
  it('accepts an origin listed exactly', () => {
    expect(isAllowedOrigin('https://french-tarot.vercel.app', allowed)).toBe(true);
  });

  it('accepts an origin matching a pattern with a star', () => {
    expect(isAllowedOrigin('https://french-tarot-git-feat-x-team.vercel.app', allowed)).toBe(true);
  });

  it('refuses a request without an origin', () => {
    expect(isAllowedOrigin(null, allowed)).toBe(false);
  });

  it('refuses look-alikes', () => {
    for (const origin of [
      'https://french-tarot.vercel.app.evil.com',
      'http://french-tarot.vercel.app',
      'https://evil.com/https://french-tarot.vercel.app',
      'https://french-tarot-x-team.vercel.app.evil.com',
      'https://french-tarot-a/b-team.vercel.app',
    ]) {
      expect(isAllowedOrigin(origin, allowed), origin).toBe(false);
    }
  });

  it('refuses everything when nothing is allowed', () => {
    expect(isAllowedOrigin('https://french-tarot.vercel.app', '')).toBe(false);
    expect(isAllowedOrigin('https://french-tarot.vercel.app', undefined)).toBe(false);
  });

  it('reads dots in the list literally', () => {
    expect(
      isAllowedOrigin('https://french-tarotXvercel.app', 'https://french-tarot.vercel.app'),
    ).toBe(false);
  });
});

describe('local development origins', () => {
  it('accept any port on localhost and 127.0.0.1, nothing else', () => {
    const dev = 'http://localhost:*,http://127.0.0.1:*';
    expect(isAllowedOrigin('http://localhost:5173', dev)).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:5174', dev)).toBe(true);
    expect(isAllowedOrigin('http://localhost.evil.com:5173', dev)).toBe(false);
    expect(isAllowedOrigin('http://localhost:5173.evil.com', dev)).toBe(false);
  });
});
