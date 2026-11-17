import type { Seat } from '@tarot/engine';

export type SeatPosition = 'bottom' | 'right' | 'topRight' | 'top' | 'topLeft' | 'left';

/** Places around the table, from my seat in play order (play runs counter-clockwise). */
const LAYOUTS: Readonly<Record<number, readonly SeatPosition[]>> = {
  3: ['bottom', 'topRight', 'topLeft'],
  4: ['bottom', 'right', 'top', 'left'],
  5: ['bottom', 'right', 'topRight', 'topLeft', 'left'],
};

/** Where each seat sits on screen, for a viewer at `mySeat` (at the bottom). */
export function seatPositions(players: number, mySeat: Seat): SeatPosition[] {
  const layout = LAYOUTS[players] ?? [];
  return Array.from(
    { length: players },
    (_, seat) => layout[(seat - mySeat + players) % players] ?? 'top',
  );
}
