import { describe, expect, it } from 'vitest';
import {
  applySessionAction,
  createDeal,
  createSession,
  getLegalActions,
  type SessionAction,
  type SessionState,
} from './index';
import { randomAction, choices } from './testing/random-player';

function apply(session: SessionState, action: SessionAction): SessionState {
  const result = applySessionAction(session, action);
  if (!result.ok) throw new Error(`${JSON.stringify(action)}: ${result.error.code}`);
  return result.session;
}

/** Plays the current deal to its end with random legal actions. */
function finishDeal(session: SessionState, seed: number): SessionState {
  const pick = choices(seed);
  let s = session;
  while (s.deal !== null) {
    const seat = s.deal.turn as number;
    const [template] = getLegalActions(s.deal, seat);
    if (!template) throw new Error('stuck');
    s = apply(s, { type: 'play', seat, action: randomAction(template, pick) });
  }
  return s;
}

const allPass = (session: SessionState): SessionState =>
  [1, 2, 3, 0]
    .map((i) => (session.dealer + i) % 4)
    .reduce(
      (s, seat) => apply(s, { type: 'play', seat, action: { type: 'bid', contract: 'pass' } }),
      session,
    );

/** A seed whose deal (dealer 0) is cancelled by a petit sec, found through the public API. */
const petitSecSeed = (() => {
  for (let seed = 0; seed < 100_000; seed++) {
    if (createDeal({ players: 4, dealer: 0, seed }).phase === 'cancelled') return seed;
  }
  throw new Error('no petit sec seed found');
})();

describe('session', () => {
  const fresh = createSession({ players: 4, deals: 2, dealer: 0 });

  it('waits for the first deal', () => {
    expect(fresh).toMatchObject({
      phase: 'waitingForDeal',
      dealer: 0,
      deal: null,
      played: 0,
      totals: [0, 0, 0, 0],
    });
    expect(
      applySessionAction(fresh, {
        type: 'play',
        seat: 1,
        action: { type: 'bid', contract: 'pass' },
      }),
    ).toEqual({
      ok: false,
      error: { code: 'NO_DEAL_IN_PROGRESS' },
    });
  });

  it('deals with the given seed and the current dealer', () => {
    const session = apply(fresh, { type: 'deal', seed: 99 });
    expect(session.deal).toEqual(createDeal({ players: 4, dealer: 0, seed: 99 }));
    expect(applySessionAction(session, { type: 'deal', seed: 1 })).toEqual({
      ok: false,
      error: { code: 'DEAL_IN_PROGRESS' },
    });
  });

  it('records a deal where everyone passes without counting it, and moves the dealer on', () => {
    const dealt = apply(fresh, { type: 'deal', seed: 99 });
    if (dealt.deal?.phase !== 'bidding') return;
    const session = allPass(dealt);
    expect(session).toMatchObject({
      phase: 'waitingForDeal',
      dealer: 1,
      played: 0,
      totals: [0, 0, 0, 0],
    });
    expect(session.history).toEqual([
      { dealer: 0, cancelled: { reason: 'allPassed' }, result: null },
    ]);
  });

  it('records a petit sec the same way, the next dealer redealing', () => {
    const session = apply(fresh, { type: 'deal', seed: petitSecSeed });
    expect(session).toMatchObject({ phase: 'waitingForDeal', dealer: 1, played: 0, deal: null });
    expect(session.history[0]).toMatchObject({ dealer: 0, cancelled: { reason: 'petitSec' } });
  });

  it('adds a finished deal to the totals and ends after the agreed number of played deals', () => {
    let session = fresh;
    let seed = 1;
    while (session.phase !== 'finished') {
      session = finishDeal(apply(session, { type: 'deal', seed: seed++ }), seed);
    }
    expect(session.played).toBe(2);
    const played = session.history.filter((h) => h.result !== null);
    expect(played).toHaveLength(2);
    const expected = [0, 1, 2, 3].map((seat) =>
      played.reduce((sum, h) => sum + (h.result?.perSeat[seat] ?? 0), 0),
    );
    expect(session.totals).toEqual(expected);
    expect(session.dealer).toBe(session.history.length % 4);
    expect(applySessionAction(session, { type: 'deal', seed: 5 })).toEqual({
      ok: false,
      error: { code: 'SESSION_OVER' },
    });
  });
});
