import type { Seat } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import { seatName } from '../lib/names';
import { fr } from '../strings/fr';
import styles from './SeatBadge.module.css';

/** A seat's name and state around the table: turn, dealer, taker, partner, last bid, cards. */
export function SeatBadge({
  view,
  seat,
  className,
}: {
  view: RoomView;
  seat: Seat;
  className?: string | undefined;
}) {
  const deal = view.deal;
  const occupant = view.seats[seat];
  const tags: string[] = [];
  if (deal?.dealer === seat) tags.push(fr.table.dealer);
  if (deal?.taker === seat) tags.push(fr.table.taker);
  if (deal?.knownPartner === seat) tags.push(fr.table.partner);
  const bid =
    deal?.phase === 'bidding' ? deal.bids.filter((b) => b.seat === seat).at(-1) : undefined;
  const status =
    occupant?.kind === 'human' && occupant.replacedByBot
      ? fr.table.replaced
      : occupant?.kind === 'human' && !occupant.connected
        ? fr.table.disconnected
        : null;
  const isTurn = deal?.turn === seat;
  return (
    <div
      className={`${styles.badge} ${isTurn ? styles.turn : ''} ${className ?? ''}`}
      aria-current={isTurn ? 'true' : undefined}
    >
      <span className={styles.name}>
        {seatName(view, seat)}
        {seat === view.you.seat ? ` ${fr.lobby.you}` : ''}
      </span>
      {tags.length > 0 && <span className={styles.tags}>{tags.join(' · ')}</span>}
      {bid && <span className={styles.bid}>{fr.bidSaid[bid.contract]}</span>}
      {deal && seat !== view.you.seat && (
        <span className={styles.meta}>
          {fr.table.cards(deal.handSizes[seat] ?? 0)}
          {deal.phase === 'playing' || deal.phase === 'finished'
            ? ` · ${fr.table.tricks(deal.tricksWon[seat] ?? 0)}`
            : ''}
        </span>
      )}
      {status && <span className={styles.status}>{status}</span>}
    </div>
  );
}
