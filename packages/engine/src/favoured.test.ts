import { describe, expect, it } from 'vitest';
import {
  EXCUSE,
  KING,
  applySessionAction,
  createFavouredDeal,
  createSession,
  isTrump,
  rankOf,
  type Card,
} from './index';

const describeHand = (hand: readonly Card[]) => ({
  trumps: hand.filter(isTrump).length,
  excuse: hand.includes(EXCUSE),
  kings: hand.filter((c) => rankOf(c) === KING).length,
});

describe('createFavouredDeal', () => {
  it.each([3, 4, 5] as const)(
    'gives the seat 11 trumps with the 21, 20, 19 and 18, the Excuse, and plain cards (%i players)',
    (players) => {
      for (let seed = 1; seed <= 30; seed++) {
        const deal = createFavouredDeal({ players, dealer: 0, seed, seat: 1 });
        const hand = deal.hands[1] ?? [];
        expect(hand).toEqual(expect.arrayContaining(['T21', 'T20', 'T19', 'T18', EXCUSE]));
        expect(describeHand(hand)).toMatchObject({ trumps: 11, excuse: true });
        // A real deal: bidding starts (no petit sec elsewhere spoils it).
        expect(deal.phase).toBe('bidding');
      }
    },
  );

  it('does not always hold Kings: the plain cards are any, high or low', () => {
    const kings = Array.from(
      { length: 40 },
      (_, seed) =>
        describeHand(createFavouredDeal({ players: 5, dealer: 0, seed, seat: 0 }).hands[0] ?? [])
          .kings,
    );
    expect(new Set(kings).size).toBeGreaterThan(1);
  });

  it('is random: the seed changes the hand', () => {
    const hands = new Set(
      Array.from({ length: 10 }, (_, seed) =>
        [...(createFavouredDeal({ players: 5, dealer: 0, seed, seat: 0 }).hands[0] ?? [])]
          .sort()
          .join(),
      ),
    );
    expect(hands.size).toBeGreaterThan(5);
  });

  it('is reproducible: the same seed gives the same deal', () => {
    const a = createFavouredDeal({ players: 5, dealer: 2, seed: 42, seat: 3 });
    const b = createFavouredDeal({ players: 5, dealer: 2, seed: 42, seat: 3 });
    expect(a).toEqual(b);
  });
});

describe('a favoured deal in a session', () => {
  it('is dealt when the deal action names the favoured seat', () => {
    const session = createSession({ players: 5, deals: 3, dealer: 0 });
    const result = applySessionAction(session, { type: 'deal', seed: 7, favoured: 2 });
    expect(result.ok && describeHand(result.session.deal?.hands[2] ?? [])).toMatchObject({
      trumps: 11,
      excuse: true,
    });
  });
});
