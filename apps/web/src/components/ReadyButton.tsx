import type { Seat } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import ui from '../design/ui.module.css';
import { awaitedNames } from '../lib/names';
import { fr } from '../strings/fr';
import styles from './ReadyButton.module.css';

/**
 * The way on when everyone at the table must agree (the next deal, a new session): the button
 * keeps its place once clicked, turning into a neutral « Prêt » (aria-disabled: it keeps the
 * focus and its contrast); who is still awaited goes on its own line.
 */
export function ReadyButton({
  view,
  ready,
  label,
  onReady,
}: {
  view: RoomView;
  /** The seats that already agreed. */
  ready: readonly Seat[];
  label: string;
  onReady: () => void;
}) {
  const me = view.you.seat;
  const awaited = awaitedNames(view, ready);
  return (
    <div className={styles.next}>
      {me !== null &&
        (ready.includes(me) ? (
          <button type="button" className={ui.button} aria-disabled="true">
            {fr.result.ready}
          </button>
        ) : (
          <button type="button" className={`${ui.button} ${ui.primary}`} onClick={onReady}>
            {label}
          </button>
        ))}
      <span className={`${ui.label} ${styles.awaited}`}>
        {awaited.length > 0 ? fr.result.waitingFor(awaited.join(', ')) : null}
      </span>
    </div>
  );
}
