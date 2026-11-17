import type { RoomView } from '@tarot/protocol';
import { cardName, formatScore } from '../lib/cards';
import { seatName } from '../lib/names';
import { fr } from '../strings/fr';
import ui from '../design/ui.module.css';
import { CardFace } from './Card';
import styles from './InfoBar.module.css';

/** Quiet, persistent game state: contract, called card, poignées, chien, scores (DESIGN.md §5). */
export function InfoBar({
  view,
  showingLastTrick,
  onToggleLastTrick,
  onOpenSheet,
}: {
  view: RoomView;
  showingLastTrick: boolean;
  onToggleLastTrick: () => void;
  onOpenSheet: () => void;
}) {
  const deal = view.deal;
  const partner = deal?.knownPartner;
  return (
    <header className={styles.bar}>
      <div className={styles.facts}>
        {deal?.contract && deal.taker !== null && (
          <strong>{fr.table.contract(fr.bid[deal.contract], seatName(view, deal.taker))}</strong>
        )}
        {deal?.calledCard && (
          <span>
            {fr.table.called(cardName(deal.calledCard))}
            {partner === 'alone'
              ? ` (${fr.table.calledAlone})`
              : typeof partner === 'number'
                ? ` (${seatName(view, partner)})`
                : ''}
          </span>
        )}
        {deal?.chelemAnnounced && <span>{fr.table.chelemAnnounced}</span>}
        {deal?.poignees.map((p) => (
          <span key={p.seat}>
            {fr.table.poignee(seatName(view, p.seat), fr.poigneeLevel[p.level])}
          </span>
        ))}
        {deal?.chien && deal.phase !== 'finished' && (
          <span className={styles.cards} aria-label={fr.table.chien}>
            {fr.table.chien}
            {deal.chien.map((card) => (
              <span key={card} className={styles.mini}>
                <CardFace card={card} />
              </span>
            ))}
          </span>
        )}
        {deal && deal.shownEcartTrumps.length > 0 && (
          <span className={styles.cards} aria-label={fr.table.ecartTrumps}>
            {fr.table.ecartTrumps}
            {deal.shownEcartTrumps.map((card) => (
              <span key={card} className={styles.mini}>
                <CardFace card={card} />
              </span>
            ))}
          </span>
        )}
      </div>
      <div className={styles.actions}>
        {view.session && (
          <span className={styles.scores}>
            {view.session.totals.map((total, seat) => (
              <span key={seat}>
                {seatName(view, seat)} {formatScore(total)}
              </span>
            ))}
          </span>
        )}
        {deal?.lastTrick && (
          <button type="button" className={`${ui.button} ${ui.quiet}`} onClick={onToggleLastTrick}>
            {showingLastTrick ? fr.table.hideLastTrick : fr.table.lastTrick}
          </button>
        )}
        <button type="button" className={`${ui.button} ${ui.quiet}`} onClick={onOpenSheet}>
          {fr.table.scoreSheet}
        </button>
      </div>
    </header>
  );
}
