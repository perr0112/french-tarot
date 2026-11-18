import type { Card } from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { dealWith, playOut, roomView, takes } from '../testing/views';
import { seatFacts } from './seatFacts';

const hand: Card[] = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10'].concat([
  'S01',
  'S02',
  'S03',
  'S04',
  'S05',
  'S06',
  'S07',
  'S08',
]) as Card[];

describe('seatFacts', () => {
  it('names a bot by its seat only, and shows the last bid while bidding', () => {
    const view = roomView(playOut(dealWith(hand), [[0, { type: 'bid', contract: 'garde' }]]));
    expect(seatFacts(view, 1)).toEqual({
      name: 'Bot 2',
      you: false,
      tags: [],
      bid: null,
      status: null,
      isTurn: true,
      cards: 18,
      tricks: null,
    });
    expect(seatFacts(view, 0)).toMatchObject({ you: true, bid: 'Garde', cards: null });
  });

  it('tags the dealer and the taker, and counts tricks once play starts', () => {
    const view = roomView(
      playOut(takes(dealWith(hand), 'gardeSans'), [[0, { type: 'decideChelem', announce: false }]]),
    );
    expect(seatFacts(view, 0).tags).toEqual(['Preneur']);
    expect(seatFacts(view, 3)).toMatchObject({ tags: ['Donneur'], cards: 18, tricks: 0 });
  });

  it('says when a player is away or replaced by a bot', () => {
    const view = roomView(dealWith(hand), 0, {
      seats: [
        { kind: 'human', nickname: 'Alice', connected: true, replacedByBot: false },
        { kind: 'human', nickname: 'Carl', connected: false, replacedByBot: false },
        { kind: 'human', nickname: 'Bob', connected: false, replacedByBot: true },
        { kind: 'bot', level: 'easy' },
      ],
    });
    expect(seatFacts(view, 1).status).toBe('déconnecté');
    expect(seatFacts(view, 2).status).toBe('remplacé par un bot');
  });
});
