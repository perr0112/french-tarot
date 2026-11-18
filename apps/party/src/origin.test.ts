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
