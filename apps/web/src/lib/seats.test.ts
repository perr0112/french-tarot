import { describe, expect, it } from 'vitest';
import { seatPositions } from './seats';

describe('seatPositions', () => {
  it('puts me at the bottom and the next player on my right (counter-clockwise play)', () => {
    expect(seatPositions(4, 0)).toEqual(['bottom', 'right', 'top', 'left']);
    expect(seatPositions(4, 2)).toEqual(['top', 'left', 'bottom', 'right']);
  });

  it('spreads three and five players around the table', () => {
    expect(seatPositions(3, 1)).toEqual(['topLeft', 'bottom', 'topRight']);
    expect(seatPositions(5, 0)).toEqual(['bottom', 'right', 'topRight', 'topLeft', 'left']);
  });
});
