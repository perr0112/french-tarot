import { useEffect, useRef, useState } from 'react';
import ui from '../design/ui.module.css';
import styles from './ConfirmButton.module.css';

export interface ConfirmWords {
  readonly button: string;
  /** A shorter label for the compact layout, if the button's is long. */
  readonly short?: string;
  readonly confirm: string;
  readonly yes: string;
  readonly stay: string;
}

/**
 * A quiet button for something hard to undo (leaving the table, abandoning a deal): when `ask`, it asks
 * first, in place, the safe answer focused, Escape choosing it; otherwise it acts at once. Once
 * answered, the focus comes back to the button.
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
  const trigger = useRef<HTMLButtonElement>(null);
  const answered = useRef(false);
  useEffect(() => {
    if (asking || !answered.current) return;
    answered.current = false;
    trigger.current?.focus();
  }, [asking]);
  const close = () => {
    answered.current = true;
    setAsking(false);
  };

  if (!asking) {
    return (
      <button
        ref={trigger}
        type="button"
        className={`${ui.button} ${ui.quiet}`}
        aria-label={words.short ? words.button : undefined}
        onClick={() => (ask ? setAsking(true) : onConfirm())}
      >
        {words.short ? (
          <>
            <span className={styles.long}>{words.button}</span>
            <span className={styles.short}>{words.short}</span>
          </>
        ) : (
          words.button
        )}
      </button>
    );
  }
  return (
    <span
      className={styles.confirm}
      role="group"
      aria-label={words.button}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
    >
      <span className={styles.question}>{words.confirm}</span>
      <button
        type="button"
        className={`${ui.button} ${ui.quiet}`}
        onClick={() => {
          close();
          onConfirm();
        }}
      >
        {words.yes}
      </button>
      <button type="button" className={ui.button} onClick={close} autoFocus>
        {words.stay}
      </button>
    </span>
  );
}
