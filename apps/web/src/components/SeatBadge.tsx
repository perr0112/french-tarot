import type { Seat } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import { seatFacts } from '../lib/seatFacts';
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
  const facts = seatFacts(view, seat);
  const counts = [
    facts.cards === null ? null : fr.table.cards(facts.cards),
    facts.tricks === null ? null : fr.table.tricks(facts.tricks),
  ].filter((text) => text !== null);
  return (
    <div
      className={`${styles.badge} ${facts.isTurn ? styles.turn : ''} ${className ?? ''}`}
      aria-current={facts.isTurn ? 'true' : undefined}
      // Where this seat's cards come from and its tricks go (motion/animate.ts).
      data-seat={seat}
    >
      <span className={styles.name}>
        {facts.name}
        {facts.you ? ` ${fr.lobby.you}` : ''}
      </span>
      {facts.tags.length > 0 && <span className={styles.tags}>{facts.tags.join(' · ')}</span>}
      {facts.bid && <span className={styles.bid}>{facts.bid}</span>}
      {counts.length > 0 && <span className={styles.meta}>{counts.join(' · ')}</span>}
      {facts.status && <span className={styles.status}>{facts.status}</span>}
    </div>
  );
}
