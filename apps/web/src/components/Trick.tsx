import type { PlayedCard } from '@tarot/engine';
import type { SeatPosition } from '../lib/seats';
import { CardFace } from './Card';
import styles from './Trick.module.css';

/** The cards of a trick, each placed towards the seat that played it. */
export function Trick({
  cards,
  positions,
  label,
  caption,
  muted = false,
}: {
  cards: readonly PlayedCard[];
  positions: readonly SeatPosition[];
  label: string;
  /** Shown under the trick, e.g. who won the last one. */
  caption?: string | undefined;
  /** A trick looked back at, not the one being played. */
  muted?: boolean;
}) {
  return (
    <figure className={`${styles.figure} ${muted ? styles.muted : ''}`}>
      <ol className={styles.trick} aria-label={label}>
        {cards.map(({ seat, card }) => (
          <li key={card} className={styles[positions[seat] ?? 'top']}>
            <CardFace card={card} />
          </li>
        ))}
      </ol>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
