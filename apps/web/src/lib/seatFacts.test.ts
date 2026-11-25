import type { Breakdown, Card } from '@tarot/engine';
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
  it('names a bot « Jade » with its number, and shows the last bid while bidding', () => {
    const view = roomView(playOut(dealWith(hand), [[0, { type: 'bid', contract: 'garde' }]]));
    expect(seatFacts(view, 1)).toEqual({
      name: 'Jade 1',
      you: false,
      tags: [],
      bid: null,
      status: null,
      isTurn: true,
      cards: 18,
      tricks: null,
      dealScore: null,
      poignee: null,
      ecartTrumps: [],
      calledCard: null,
      alone: false,
    });
    expect(seatFacts(view, 0)).toMatchObject({ you: true, bid: 'Garde', cards: null });
  });

  it('tags the dealer and the taker, and counts tricks once play starts', () => {
    const view = roomView(
      playOut(takes(dealWith(hand), 'gardeSans'), [[0, { type: 'decideChelem', announce: false }]]),
    );
    expect(seatFacts(view, 0).tags).toEqual(['Preneur', 'avec le chien']);
    expect(seatFacts(view, 3)).toMatchObject({ tags: ['Donneur'], cards: 18, tricks: 0 });
  });

  it('says when a player is away, replaced by a bot, or lets a bot play', () => {
    const view = roomView(dealWith(hand), 0, {
      seats: [
        {
          kind: 'human',
          nickname: 'Alice',
          connected: true,
          replacedByBot: false,
          autoplay: false,
          hacker: false,
        },
        {
          kind: 'human',
          nickname: 'Carl',
          connected: false,
          replacedByBot: false,
          autoplay: false,
          hacker: false,
        },
        {
          kind: 'human',
          nickname: 'Bob',
          connected: false,
          replacedByBot: true,
          autoplay: false,
          hacker: false,
        },
        {
          kind: 'human',
          nickname: 'Dan',
          connected: true,
          replacedByBot: false,
          autoplay: true,
          hacker: false,
        },
      ],
    });
    expect(seatFacts(view, 1).status).toBe('déconnecté');
    expect(seatFacts(view, 2).status).toBe('remplacé par un bot');
    expect(seatFacts(view, 3).status).toBe('jeu auto');
  });

  it('tags each defender with the chien in a garde contre', () => {
    const view = roomView(takes(dealWith(hand), 'gardeContre'), 1);
    expect(seatFacts(view, 0).tags).toEqual(['Preneur']);
    expect([1, 2, 3].map((seat) => seatFacts(view, seat).tags.includes('avec le chien'))).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('shows what each seat scored while the table waits for the next deal', () => {
    // A garde by Alice, failed by 31: −112 for her side, three times over.
    const result: Breakdown = {
      contract: 'garde',
      taker: 0,
      partner: null,
      multiplier: 2,
      points: 20,
      oudlers: 1,
      needed: 51,
      made: false,
      gap: 31,
      contractScore: -112,
      petitAuBout: 0,
      poignee: 0,
      chelem: 0,
      dealScore: -112,
      perSeat: [-336, 112, 112, 112],
    };
    const view = roomView(null, 0, {
      session: {
        deals: 8,
        played: 1,
        dealer: 0,
        totals: [-336, 112, 112, 112],
        history: [{ dealer: 3, result, cancelled: null }],
        continued: [],
      },
    });
    expect(seatFacts(view, 0).dealScore).toBe(-336);
    expect(seatFacts(view, 1).dealScore).toBe(112);
  });
});
