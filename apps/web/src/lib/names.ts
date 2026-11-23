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
