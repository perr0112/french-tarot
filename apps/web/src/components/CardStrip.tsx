import type { Card } from '@tarot/engine';
import { CardBack, CardFace } from './Card';
import styles from './CardStrip.module.css';

/**
 * A labelled row of small cards: face up (the chien, shown écart trumps, a poignée) or, given
 * only a count, face down (a chien nobody may see).
 */
export function CardStrip({
  label,
  cards = [],
  hidden = 0,
}: {
  label: string;
  cards?: readonly Card[];
  hidden?: number;
}) {
  return (
    <span className={styles.strip} role="group" aria-label={label}>
      {label}
      {cards.map((card) => (
        <span key={card} className={styles.mini}>
          <CardFace card={card} size="mini" />
        </span>
      ))}
      {Array.from({ length: hidden }, (_, i) => (
        <span key={i} className={styles.mini}>
          <CardBack />
        </span>
      ))}
    </span>
  );
}
