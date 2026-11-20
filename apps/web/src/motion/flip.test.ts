import { describe, expect, it } from 'vitest';
import { flipFrom } from './flip';

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });

describe('flipFrom', () => {
  it('moves centre to centre, scaled to the starting width', () => {
    // From a 40 px wide box centred on (120, 70) to an 80 px wide card centred on (40, 40).
    expect(flipFrom(rect(100, 50, 40, 40), rect(0, 0, 80, 80))).toEqual({
      x: 80,
      y: 30,
      scale: 0.5,
    });
  });

  it('is the identity when nothing moved', () => {
    expect(flipFrom(rect(10, 20, 30, 40), rect(10, 20, 30, 40))).toEqual({
      x: 0,
      y: 0,
      scale: 1,
    });
  });

  it('keeps the scale at 1 for an empty target', () => {
    expect(flipFrom(rect(0, 0, 10, 10), rect(0, 0, 0, 0)).scale).toBe(1);
  });
});
