import { REACTIONS, type Reaction } from '@tarot/protocol';
import { useEffect, useRef, useState } from 'react';
import ui from '../design/ui.module.css';
import { fr } from '../strings/fr';
import styles from './ReactionPicker.module.css';

/**
 * By one's badge: opens the six reactions, the first focused; one picked is sent (AGENTS.md
 * §6). Escape, a click elsewhere or a pick closes the row, the focus back on « Réagir ».
 */
export function ReactionPicker({
  onReact,
  className,
}: {
  onReact: (emoji: Reaction) => void;
  className?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };

  return (
    <div ref={root} className={`${styles.picker} ${className ?? ''}`}>
      <button
        ref={toggle}
        type="button"
        className={`${ui.button} ${ui.quiet}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {fr.reactions.open}
      </button>
      {open && (
        <div
          className={`${styles.row} ${ui.enter}`}
          role="group"
          aria-label={fr.reactions.title}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close();
          }}
        >
          {REACTIONS.map((emoji, i) => (
            <button
              key={emoji}
              ref={i === 0 ? first : undefined}
              type="button"
              className={styles.emoji}
              aria-label={fr.reactions.names[emoji]}
              title={fr.reactions.names[emoji]}
              onClick={() => {
                close();
                onReact(emoji);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
