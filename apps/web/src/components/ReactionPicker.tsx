import { REACTIONS, type Reaction } from '@tarot/protocol';
import { useState } from 'react';
import ui from '../design/ui.module.css';
import { fr } from '../strings/fr';
import styles from './ReactionPicker.module.css';

/** By one's badge: opens the six reactions; one picked is sent and the row closes (AGENTS.md §6). */
export function ReactionPicker({
  onReact,
  className,
}: {
  onReact: (emoji: Reaction) => void;
  className?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.picker} ${className ?? ''}`}>
      {open && (
        <div className={`${styles.row} ${ui.enter}`} role="group" aria-label={fr.reactions.title}>
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={styles.emoji}
              aria-label={emoji}
              onClick={() => {
                setOpen(false);
                onReact(emoji);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`${ui.button} ${ui.quiet} ${styles.toggle}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {fr.reactions.open}
      </button>
    </div>
  );
}
