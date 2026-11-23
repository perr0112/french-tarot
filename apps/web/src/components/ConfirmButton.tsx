import { useState } from 'react';
import ui from '../design/ui.module.css';
import styles from './ConfirmButton.module.css';

export interface ConfirmWords {
  readonly button: string;
  readonly confirm: string;
  readonly yes: string;
  readonly stay: string;
}

/**
 * A quiet button for something hard to undo (leaving the table, redealing): when `ask`, it asks
 * first, in place, the safe answer focused; otherwise it acts at once.
 */
export function ConfirmButton({
  words,
  ask,
  onConfirm,
}: {
  words: ConfirmWords;
  ask: boolean;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button
        type="button"
        className={`${ui.button} ${ui.quiet}`}
        onClick={() => (ask ? setAsking(true) : onConfirm())}
      >
        {words.button}
      </button>
    );
  }
  return (
    <span className={styles.confirm} role="group" aria-label={words.button}>
      <span>{words.confirm}</span>
      <button
        type="button"
        className={`${ui.button} ${ui.quiet}`}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {words.yes}
      </button>
      <button type="button" className={ui.button} onClick={() => setAsking(false)} autoFocus>
        {words.stay}
      </button>
    </span>
  );
}
