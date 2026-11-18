import type { Card } from '@tarot/engine';
import { describe, expect, it } from 'vitest';
import { defaultPoignee, ecartStatus, poigneeStatus } from './selection';

const template = (eligible: Card[], trumpsAllowed = false) => ({
  type: 'ecart' as const,
  count: 3,
  eligible,
  trumpsAllowed,
});

describe('ecartStatus', () => {
  it('is ready once exactly the required number of eligible cards is chosen', () => {
    const t = template(['C02', 'C05', 'D03', 'D04']);
    expect(ecartStatus(t, ['C02', 'C05'])).toEqual({
      ready: false,
      missing: 1,
      trumpsTooSoon: false,
    });
    expect(ecartStatus(t, ['C02', 'C05', 'D03'])).toEqual({
      ready: true,
      missing: 0,
      trumpsTooSoon: false,
    });
  });

  it('refuses a trump while another eligible card is left out', () => {
    const t = template(['C02', 'C05', 'T02', 'T03'], true);
    expect(ecartStatus(t, ['C02', 'T02', 'T03'])).toEqual({
      ready: false,
      missing: 0,
      trumpsTooSoon: true,
    });
    expect(ecartStatus(t, ['C02', 'C05', 'T02']).ready).toBe(true);
  });
});

const poignee = (eligible: Card[]) => ({
  eligible,
  levels: [
    { level: 'simple' as const, size: 3 },
    { level: 'double' as const, size: 4 },
  ],
});

describe('poignee selection', () => {
  it('starts from the weakest trumps for a level', () => {
    expect(defaultPoignee(poignee(['T02', 'T05', 'T09', 'T12']), 'simple')).toEqual([
      'T02',
      'T05',
      'T09',
    ]);
  });

  it('uses the Excuse only when trumps fall short', () => {
    expect(defaultPoignee(poignee(['EXC', 'T02', 'T05', 'T09']), 'double')).toEqual([
      'T02',
      'T05',
      'T09',
      'EXC',
    ]);
    expect(defaultPoignee(poignee(['EXC', 'T02', 'T05', 'T09']), 'simple')).toEqual([
      'T02',
      'T05',
      'T09',
    ]);
  });

  it('tells the level a selection makes, if any', () => {
    const t = poignee(['EXC', 'T02', 'T05', 'T09', 'T12']);
    expect(poigneeStatus(t, ['T02', 'T05', 'T09'])).toEqual({
      level: 'simple',
      excuseNotAllowed: false,
    });
    expect(poigneeStatus(t, ['T02', 'T05'])).toEqual({ level: null, excuseNotAllowed: false });
    expect(poigneeStatus(t, ['T02', 'T05', 'EXC'])).toEqual({
      level: null,
      excuseNotAllowed: true,
    });
  });
});
