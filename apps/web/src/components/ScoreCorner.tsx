import type { RoomView } from '@tarot/protocol';
import { useLayoutEffect, useRef, useState } from 'react';
import ui from '../design/ui.module.css';
import { formatScore } from '../lib/cards';
import { rankSeats } from '../lib/ranking';
import { scoreTone } from '../lib/score';
import { fr } from '../strings/fr';
import { ScoreSheet } from './ScoreSheet';
import { SeatName } from './SeatName';
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
  const corner = useRef<HTMLElement>(null);
  // The sheet opens above the slip: it may be as tall as the room there, and scrolls inside.
  useLayoutEffect(() => {
    const slip = corner.current;
    if (!open || !slip) return;
    const measure = () =>
      slip.style.setProperty('--room-above', `${slip.getBoundingClientRect().top}px`);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);
  const session = view.session;
  if (!session) return null;
  const ranking = rankSeats(session.totals);
  return (
    <section
      ref={corner}
      className={`${styles.corner} ${open ? styles.open : ''} ${className ?? ''}`}
    >
      <div className={styles.head}>
        <h2 className={styles.title}>{fr.table.scores}</h2>
        <button
          type="button"
          className={`${ui.button} ${ui.quiet} ${styles.toggle}`}
          aria-expanded={open}
          aria-label={open ? fr.table.foldSheet : fr.table.scoreSheet}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            fr.table.foldSheet
          ) : (
            <>
              <span className={styles.long}>{fr.table.scoreSheet}</span>
              {/* On a phone the folded slip is this button alone, beside the badge: short. */}
              <span className={styles.short}>{fr.table.scores}</span>
            </>
          )}
        </button>
      </div>
      <ol className={styles.totals} aria-label={fr.table.scores}>
        {ranking.map(({ seat, total }) => (
          <li key={seat} className={seat === view.you.seat ? styles.me : ''}>
            <span className={styles.name}>
              <SeatName view={view} seat={seat} />
            </span>
            <span className={`${styles.total} ${scoreTone(total)}`}>{formatScore(total)}</span>
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
