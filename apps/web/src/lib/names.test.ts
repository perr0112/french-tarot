import { describe, expect, it } from 'vitest';
import { roomView } from '../testing/views';
import { seatName } from './names';

describe('seatName', () => {
  it('numbers the bots among themselves, in seat order: Jade 1, Jade 2…', () => {
    const view = roomView(null);
    // Seats: Alice, a bot, Bob, a bot.
    expect([0, 1, 2, 3].map((seat) => seatName(view, seat))).toEqual([
      'Alice',
      'Jade 1',
      'Bob',
      'Jade 2',
    ]);
  });

  it('keeps the nickname of a player a bot stands in for', () => {
    const view = roomView(null, 0, {
      seats: [
        { kind: 'human', nickname: 'Alice', connected: false, replacedByBot: true },
        { kind: 'bot', level: 'medium' },
        { kind: 'empty' },
        { kind: 'bot', level: 'easy' },
      ],
    });
    expect([0, 1, 3].map((seat) => seatName(view, seat))).toEqual(['Alice', 'Jade 1', 'Jade 2']);
  });
});
