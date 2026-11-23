import type { RoomView } from '@tarot/protocol';
import { seatName } from '../lib/names';
import { fr } from '../strings/fr';
import ui from '../design/ui.module.css';
import { ConfirmButton } from './ConfirmButton';
import { LeaveButton } from './LeaveButton';
import styles from './InfoBar.module.css';

/**
 * Quiet, persistent game state: the contract and a chelem announced (DESIGN.md §5), the last
 * trick to look back at, and the way out. The chien lies in the centre; what a player shows or
 * calls is at their seat; the scores are in a corner of the table.
 */
export function InfoBar({
  view,
  showingLastTrick,
  onToggleLastTrick,
  onLeave,
  onAutoplay,
  onAbandonDeal,
}: {
  view: RoomView;
  showingLastTrick: boolean;
  onToggleLastTrick: () => void;
  onLeave?: (() => void) | undefined;
  /** Lets a bot play the local seat, or takes it back. */
  onAutoplay?: ((on: boolean) => void) | undefined;
  /** Offered to a lone player among bots while a deal is in progress. */
  onAbandonDeal?: (() => void) | undefined;
}) {
  const deal = view.deal;
  const me = view.you.seat === null ? undefined : view.seats[view.you.seat];
  const autoplay = me?.kind === 'human' && me.autoplay;
  return (
    <header className={styles.bar}>
      <div className={styles.facts}>
        {deal?.contract && deal.taker !== null && (
          <strong>{fr.table.contract(fr.bid[deal.contract], seatName(view, deal.taker))}</strong>
        )}
        {deal?.chelemAnnounced && <span>{fr.table.chelemAnnounced}</span>}
      </div>
      <div className={styles.actions}>
        {deal?.lastTrick && (
          <button type="button" className={`${ui.button} ${ui.quiet}`} onClick={onToggleLastTrick}>
            {showingLastTrick ? fr.table.hideLastTrick : fr.table.lastTrick}
          </button>
        )}
        {onAbandonDeal && <ConfirmButton words={fr.redeal} ask onConfirm={onAbandonDeal} />}
        {onAutoplay && (
          <button
            type="button"
            className={`${ui.button} ${ui.quiet} ${autoplay ? styles.on : ''}`}
            aria-pressed={autoplay}
            onClick={() => onAutoplay(!autoplay)}
          >
            {autoplay ? fr.table.autoplayActive : fr.table.autoplay}
          </button>
        )}
        {onLeave && <LeaveButton confirm onLeave={onLeave} />}
      </div>
    </header>
  );
}
