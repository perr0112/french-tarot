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
    'gives the seat 12 trumps with the 21, 20 and 19, the Excuse and two Kings (%i players)',
    (players) => {
      for (let seed = 1; seed <= 30; seed++) {
        const deal = createFavouredDeal({ players, dealer: 0, seed, seat: 1 });
        const hand = deal.hands[1] ?? [];
        expect(hand).toEqual(expect.arrayContaining(['T21', 'T20', 'T19', EXCUSE]));
        const facts = describeHand(hand);
        expect(facts.excuse).toBe(true);
        if (players === 5) expect(facts).toEqual({ trumps: 12, excuse: true, kings: 2 });
        else {
          expect(facts.trumps).toBeGreaterThanOrEqual(12);
          expect(facts.kings).toBeGreaterThanOrEqual(2);
        }
        // A real deal: bidding starts (no petit sec elsewhere spoils it).
        expect(deal.phase).toBe('bidding');
      }
    },
  );

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
    expect(result.ok && describeHand(result.session.deal?.hands[2] ?? [])).toEqual({
      trumps: 12,
      excuse: true,
      kings: 2,
    });
  });
});
