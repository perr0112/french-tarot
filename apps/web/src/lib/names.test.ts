import { describe, expect, it } from 'vitest';
import { roomView } from '../testing/views';
import { seatName } from './names';

describe('seatName', () => {
  it('calls a bot Jade with the number the room gave it', () => {
    const view = roomView(null, 0, {
      seats: [
        {
          kind: 'human',
          nickname: 'Alice',
          connected: true,
          replacedByBot: false,
          autoplay: false,
        },
        { kind: 'bot', level: 'medium', number: 3 },
        { kind: 'empty' },
        { kind: 'bot', level: 'easy', number: 1 },
      ],
    });
    expect([0, 1, 2, 3].map((seat) => seatName(view, seat))).toEqual([
      'Alice',
      'Jade 3',
      'Siège 3',
      'Jade 1',
    ]);
  });

  it('keeps the nickname of a player a bot stands in for', () => {
    const view = roomView(null, 0, {
      seats: [
        {
          kind: 'human',
          nickname: 'Alice',
          connected: false,
          replacedByBot: true,
          autoplay: false,
        },
        { kind: 'bot', level: 'medium', number: 1 },
        { kind: 'bot', level: 'medium', number: 2 },
        { kind: 'bot', level: 'easy', number: 3 },
      ],
    });
    expect(seatName(view, 0)).toBe('Alice');
  });
});
