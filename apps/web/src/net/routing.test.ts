import { describe, expect, it } from 'vitest';
import { routeOf } from './routing';

describe('routeOf', () => {
  it('opens a room from its link', () => {
    expect(routeOf('/salle/ABCDEF', false)).toEqual({ name: 'room', code: 'ABCDEF' });
  });

  it('opens the card contact sheet in development only', () => {
    expect(routeOf('/dev/cartes', true)).toEqual({ name: 'cards' });
    expect(routeOf('/dev/cartes', false)).toEqual({ name: 'home' });
  });
});
