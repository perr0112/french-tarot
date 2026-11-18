import type { Card } from '@tarot/engine';
import type { CSSProperties } from 'react';
import { sortHand } from '../lib/hand';
import { cardName } from '../lib/cards';
import { fr } from '../strings/fr';
import { CardFace } from './Card';
import styles from './Hand.module.css';

export interface HandProps {
  readonly cards: readonly Card[];
  /** Cards that may be clicked now; null when the hand is only shown. */
  readonly active: readonly Card[] | null;
  /** Cards picked (écart); shown raised. */
  readonly selected?: readonly Card[];
  readonly onPick?: (card: Card) => void;
}

/** The local player's hand as a fan; unplayable cards dimmed and not clickable (AGENTS.md §6). */
export function Hand({ cards, active, selected = [], onPick }: HandProps) {
  return (
    <ul
      className={styles.hand}
      aria-label={fr.table.yourHand}
      style={{ '--count': cards.length } as CSSProperties}
    >
      {sortHand(cards).map((card) => {
        const enabled = active?.includes(card) ?? false;
        const picked = selected.includes(card);
        return (
          <li key={card} className={styles.slot}>
            <button
              type="button"
              className={`${styles.card} ${active && !enabled ? styles.dimmed : ''} ${enabled ? styles.enabled : ''} ${picked ? styles.picked : ''}`}
              disabled={!enabled}
              aria-pressed={selected.length > 0 || picked ? picked : undefined}
              aria-label={cardName(card)}
              onClick={() => onPick?.(card)}
            >
              <CardFace card={card} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
