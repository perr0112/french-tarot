import type { Seat } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import { fr } from '../strings/fr';

/**
 * How a seat is called on screen: the player's nickname, or for a bot "Jade 2", by the number
 * the room gave it when it sat (the level shows in the lobby).
 */
export function seatName(view: RoomView, seat: Seat): string {
  const occupant = view.seats[seat];
  if (occupant?.kind === 'human') return occupant.nickname;
  if (occupant?.kind === 'bot') return fr.table.bot(occupant.number);
  return fr.lobby.seat(seat + 1);
}

/**
 * The other connected players still awaited before the table goes on (the next deal, the next
 * session), by name: the local player has their own button.
 */
export function awaitedNames(view: RoomView, ready: readonly Seat[]): string[] {
  return view.seats.flatMap((occupant, seat) =>
    seat !== view.you.seat &&
    occupant.kind === 'human' &&
    occupant.connected &&
    !ready.includes(seat)
      ? [seatName(view, seat)]
      : [],
  );
}
