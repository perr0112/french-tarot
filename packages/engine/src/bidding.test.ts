import { describe, expect, it } from 'vitest';
import { applyAction, getLegalActions } from './index';
import { SIMPLE_CHIEN, bid, play, simpleDeal } from './testing/fixtures';

describe('bidding', () => {
  it('lets the seat after the dealer speak first, with every contract available', () => {
    const deal = simpleDeal(0);
    expect(getLegalActions(deal, 1)).toEqual([
      { type: 'bid', choices: ['pass', 'petite', 'garde', 'gardeSans', 'gardeContre'] },
    ]);
    expect(getLegalActions(deal, 2)).toEqual([]);
  });

  it('rejects an unknown action type instead of crashing', () => {
    const bogus = { type: 'shuffle' } as unknown as Parameters<typeof applyAction>[2];
    expect(applyAction(simpleDeal(0), 1, bogus)).toEqual({
      ok: false,
      error: { code: 'UNKNOWN_ACTION' },
    });
  });

  it('rejects a seat speaking out of turn', () => {
    const result = applyAction(simpleDeal(0), 2, bid('petite'));
    expect(result).toEqual({ ok: false, error: { code: 'NOT_YOUR_TURN' } });
  });

  it('only allows higher contracts after a bid', () => {
    const deal = play(simpleDeal(0), [[1, bid('garde')]]);
    expect(getLegalActions(deal, 2)).toEqual([
      { type: 'bid', choices: ['pass', 'gardeSans', 'gardeContre'] },
    ]);
    expect(applyAction(deal, 2, bid('petite'))).toEqual({
      ok: false,
      error: { code: 'BID_TOO_LOW' },
    });
  });

  it('cancels the deal when everyone passes', () => {
    const deal = play(simpleDeal(0), [
      [1, bid('pass')],
      [2, bid('pass')],
      [3, bid('pass')],
      [0, bid('pass')],
    ]);
    expect(deal).toMatchObject({ phase: 'cancelled', cancelled: { reason: 'allPassed' } });
  });

  it('gives the highest bidder the contract and the chien in petite or garde', () => {
    const deal = play(simpleDeal(0), [
      [1, bid('petite')],
      [2, bid('garde')],
      [3, bid('pass')],
      [0, bid('pass')],
    ]);
    expect(deal).toMatchObject({ phase: 'ecart', taker: 2, contract: 'garde', turn: 2 });
    expect(deal.hands[2]).toHaveLength(24);
    expect(deal.hands[2]).toEqual(expect.arrayContaining(SIMPLE_CHIEN));
  });

  it('moves to the chelem decision in garde sans, without touching the chien', () => {
    const deal = play(simpleDeal(0), [
      [1, bid('pass')],
      [2, bid('gardeSans')],
      [3, bid('pass')],
      [0, bid('pass')],
    ]);
    expect(deal).toMatchObject({ phase: 'chelemDecision', taker: 2, turn: 2 });
    expect(deal.hands[2]).toHaveLength(18);
  });

  it('goes straight to play when chelem announcements are disabled', () => {
    const deal = play(simpleDeal(0, { chelemAnnouncements: false }), [
      [1, bid('pass')],
      [2, bid('gardeSans')],
      [3, bid('pass')],
      [0, bid('pass')],
    ]);
    expect(deal).toMatchObject({ phase: 'playing', turn: 1 });
  });

  it('ends the bidding at once on a garde contre, since nobody can bid higher', () => {
    const deal = play(simpleDeal(0), [[1, bid('gardeContre')]]);
    expect(deal).toMatchObject({ phase: 'chelemDecision', taker: 1, contract: 'gardeContre' });
  });
});
