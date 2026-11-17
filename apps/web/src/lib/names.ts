import type { Seat } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import { fr } from '../strings/fr';

/** How a seat is called on screen: the player's nickname, or "Bot 3 (Moyen)". */
export function seatName(view: RoomView, seat: Seat): string {
  const occupant = view.seats[seat];
  if (occupant?.kind === 'human') return occupant.nickname;
  if (occupant?.kind === 'bot') return `Bot ${seat + 1} (${fr.botLevel[occupant.level]})`;
  return fr.lobby.seat(seat + 1);
}
