import { useState } from 'react';
import ui from '../design/ui.module.css';
import { fr } from '../strings/fr';
import styles from './LeaveButton.module.css';

/**
 * Leaves the table (AGENTS.md §5). During a session a bot takes the seat, so it asks first, in
 * place; in the lobby or once the session is over it leaves at once.
 */
export function LeaveButton({ confirm, onLeave }: { confirm: boolean; onLeave: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button
        type="button"
        className={`${ui.button} ${ui.quiet}`}
        onClick={() => (confirm ? setAsking(true) : onLeave())}
      >
        {fr.leave.button}
      </button>
    );
  }
  return (
    <span className={styles.confirm} role="group" aria-label={fr.leave.button}>
      <span>{fr.leave.confirm}</span>
      <button type="button" className={`${ui.button} ${ui.quiet}`} onClick={onLeave}>
        {fr.leave.yes}
      </button>
      <button type="button" className={ui.button} onClick={() => setAsking(false)} autoFocus>
        {fr.leave.stay}
      </button>
    </span>
  );
}
