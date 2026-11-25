import type { Seat } from '@tarot/engine';
import type { RoomView, ThrowItem } from '@tarot/protocol';
import { useRef, useState } from 'react';
import ui from '../design/ui.module.css';
import { cardName, formatScore } from '../lib/cards';
import { seatName } from '../lib/names';
import type { PoigneeShowing } from '../hooks/useFreshPoignees';
import type { ShownReaction } from '../hooks/useReactions';
import { seatFacts } from '../lib/seatFacts';
import { fr } from '../strings/fr';
import { CardStrip } from './CardStrip';
import { ScoreChip } from './ScoreChip';
import { SeatName } from './SeatName';
import { ThrowPicker } from './Throws';
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
  reaction = null,
  bubbleOnLeft = false,
  onThrow,
}: {
  view: RoomView;
  seat: Seat;
  className?: string | undefined;
  /** Whether its poignée is still shown (hooks/useFreshPoignees.ts). */
  poigneeShowing?: PoigneeShowing | null | undefined;
  /** A reaction its player just sent (hooks/useReactions.ts), shown in a bubble. */
  reaction?: ShownReaction | null | undefined;
  /** The reaction bubble on the left corner: for seats on the right of the table, so it stays in. */
  bubbleOnLeft?: boolean;
  /** Throws something at this seat's player (another one); its picker opens from the badge. */
  onThrow?: ((item: ThrowItem) => void) | undefined;
}) {
  const facts = seatFacts(view, seat);
  const [throwing, setThrowing] = useState(false);
  const target = useRef<HTMLButtonElement>(null);
  const closeThrow = () => {
    setThrowing(false);
    target.current?.focus();
  };
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
      {onThrow && (
        // The whole badge: a click opens what to throw at this player.
        <button
          ref={target}
          type="button"
          className={styles.throwTarget}
          aria-label={fr.throws.open(facts.name)}
          aria-expanded={throwing}
          onClick={() => setThrowing(!throwing)}
        />
      )}
      {onThrow && throwing && (
        <ThrowPicker
          name={facts.name}
          onClose={closeThrow}
          onThrow={(item) => {
            closeThrow();
            onThrow(item);
          }}
        />
      )}
      {reaction && (
        <span
          // A new reaction pops anew, even the same emoji twice.
          key={reaction.id}
          className={`${styles.reaction} ${bubbleOnLeft ? styles.onLeft : ''}`}
          role="img"
          aria-label={fr.reactions.shown(facts.name, reaction.emoji)}
        >
          {reaction.emoji}
        </span>
      )}
      <span className={styles.name}>
        <SeatName view={view} seat={seat} />
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
        <ScoreChip
          value={facts.dealScore}
          label={fr.table.dealScore(formatScore(facts.dealScore))}
          className={`${styles.score} ${ui.enter}`}
        />
      )}
    </div>
  );
}
