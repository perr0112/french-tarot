import type { RoomView } from '@tarot/protocol';
import { useState } from 'react';
import ui from '../design/ui.module.css';
import { formatScore } from '../lib/cards';
import { seatName } from '../lib/names';
import { rankSeats } from '../lib/ranking';
import { fr } from '../strings/fr';
import { ScoreSheet } from './ScoreSheet';
import styles from './ScoreCorner.module.css';

/**
 * The session's scores in a corner of the table (DESIGN.md §5): folded, each player's total,
 * best first; unfolded, the whole score sheet, deal by deal, opening above the slip so nothing
 * around it moves.
 */
export function ScoreCorner({
  view,
  className,
}: {
  view: RoomView;
  className?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const session = view.session;
  if (!session) return null;
  const ranking = rankSeats(session.totals);
  return (
    <section className={`${styles.corner} ${open ? styles.open : ''} ${className ?? ''}`}>
      <div className={styles.head}>
        <h2 className={styles.title}>{fr.table.scores}</h2>
        <button
          type="button"
          className={`${ui.button} ${ui.quiet} ${styles.toggle}`}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? fr.table.foldSheet : fr.table.scoreSheet}
        </button>
      </div>
      <ol className={styles.totals} aria-label={fr.table.scores}>
        {ranking.map(({ seat, total }) => (
          <li key={seat} className={seat === view.you.seat ? styles.me : ''}>
            <span className={styles.name}>{seatName(view, seat)}</span>
            <span className={styles.total}>{formatScore(total)}</span>
          </li>
        ))}
      </ol>
      {open && (
        <div
          className={`${styles.sheet} ${ui.enter}`}
          role="region"
          aria-label={fr.table.scoreSheet}
        >
          <ScoreSheet view={view} />
        </div>
      )}
    </section>
  );
}
