import type { Seat } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import { fr } from '../strings/fr';
import { seatName } from './names';

/** What the table shows about one seat (DESIGN.md §5). */
export interface SeatFacts {
  readonly name: string;
  readonly you: boolean;
  /** Donneur, Preneur, Partenaire. */
  readonly tags: readonly string[];
  /** The seat's last bid, during the bidding only. */
  readonly bid: string | null;
  /** Away or replaced by a bot. */
  readonly status: string | null;
  readonly isTurn: boolean;
  /** Cards left in an opponent's hand while the deal runs. */
  readonly cards: number | null;
  /** Tricks won, once the play has started. */
  readonly tricks: number | null;
}

export function seatFacts(view: RoomView, seat: Seat): SeatFacts {
  const deal = view.deal;
  const occupant = view.seats[seat];
  const you = seat === view.you.seat;
  const tags: string[] = [];
  if (deal?.dealer === seat) tags.push(fr.table.dealer);
  if (deal?.taker === seat) tags.push(fr.table.taker);
  if (deal?.knownPartner === seat) tags.push(fr.table.partner);
  const bid =
    deal?.phase === 'bidding' ? deal.bids.filter((b) => b.seat === seat).at(-1) : undefined;
  const human = occupant?.kind === 'human' ? occupant : null;
  const status = human?.replacedByBot
    ? fr.table.replaced
    : human && !human.connected
      ? fr.table.disconnected
      : null;
  const running = deal !== null && deal.phase !== 'finished';
  return {
    name: seatName(view, seat),
    you,
    tags,
    bid: bid ? fr.bidSaid[bid.contract] : null,
    status,
    isTurn: deal?.turn === seat,
    cards: running && !you ? (deal.handSizes[seat] ?? 0) : null,
    tricks:
      deal?.phase === 'playing' || deal?.phase === 'finished' ? (deal.tricksWon[seat] ?? 0) : null,
  };
}
