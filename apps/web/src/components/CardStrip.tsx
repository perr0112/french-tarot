import type { Card } from '@tarot/engine';
import { CardFace } from './Card';
import styles from './CardStrip.module.css';

/** A labelled row of small face-up cards: the chien, shown écart trumps, a poignée. */
export function CardStrip({ label, cards }: { label: string; cards: readonly Card[] }) {
  return (
    <span className={styles.strip} role="group" aria-label={label}>
      {label}
      {cards.map((card) => (
        <span key={card} className={styles.mini}>
          <CardFace card={card} />
        </span>
      ))}
    </span>
  );
}
