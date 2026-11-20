import type { Seat } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import ui from '../design/ui.module.css';
import { cardName, formatScore } from '../lib/cards';
import { seatName } from '../lib/names';
import type { PoigneeShowing } from '../hooks/useFreshPoignees';
import { seatFacts } from '../lib/seatFacts';
import { fr } from '../strings/fr';
import { CardStrip } from './CardStrip';
import styles from './SeatBadge.module.css';

/**
 * A seat's name and state around the table: turn, dealer, taker, partner, last bid, cards; what
 * it called or shows (the called King, a fresh poignée, the taker's écart trumps) and what it
 * scored in the last deal.
 */
export function SeatBadge({
  view,
  seat,
  className,
  poigneeShowing = null,
}: {
  view: RoomView;
  seat: Seat;
  className?: string | undefined;
  /** Whether its poignée is still shown (hooks/useFreshPoignees.ts). */
  poigneeShowing?: PoigneeShowing | null | undefined;
}) {
  const facts = seatFacts(view, seat);
  const { poignee, ecartTrumps, calledCard } = facts;
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
      {calledCard && (
        <CardStrip
          label={fr.table.called(cardName(calledCard))}
          caption={facts.alone ? fr.table.calledAloneShort : fr.table.calledShort}
          cards={[calledCard]}
        />
      )}
      {poignee && poigneeShowing && (
        <span className={poigneeShowing === 'fading' ? styles.fading : ui.enter}>
          <CardStrip
            label={fr.table.poignee(seatName(view, seat), fr.poigneeLevel[poignee.level])}
            caption={fr.table.poigneeShown(fr.poigneeLevel[poignee.level])}
            cards={poignee.cards}
          />
        </span>
      )}
      {ecartTrumps.length > 0 && <CardStrip label={fr.table.ecartTrumps} cards={ecartTrumps} />}
      {facts.dealScore !== null && (
        <span
          className={`${styles.score} ${facts.dealScore < 0 ? ui.negative : ui.positive} ${ui.enter}`}
          aria-label={fr.table.dealScore(formatScore(facts.dealScore))}
        >
          {formatScore(facts.dealScore)}
        </span>
      )}
    </div>
  );
}
