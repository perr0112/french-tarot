import type { Seat } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import { fr } from '../strings/fr';

/**
 * How a seat is called on screen: the player's nickname, or for a bot "Jade 2", the bots
 * numbered among themselves in seat order (the level shows in the lobby).
 */
export function seatName(view: RoomView, seat: Seat): string {
  const occupant = view.seats[seat];
  if (occupant?.kind === 'human') return occupant.nickname;
  if (occupant?.kind === 'bot') {
    const rank = view.seats.slice(0, seat + 1).filter((o) => o.kind === 'bot').length;
    return fr.table.bot(rank);
  }
  return fr.lobby.seat(seat + 1);
}
