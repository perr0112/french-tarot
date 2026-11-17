import type { PlayedCard } from '@tarot/engine';
import type { SeatPosition } from '../lib/seats';
import { CardFace } from './Card';
import styles from './Trick.module.css';

/** The cards of a trick, each placed towards the seat that played it. */
export function Trick({
  cards,
  positions,
  label,
}: {
  cards: readonly PlayedCard[];
  positions: readonly SeatPosition[];
  label: string;
}) {
  return (
    <ol className={styles.trick} aria-label={label}>
      {cards.map(({ seat, card }) => (
        <li key={card} className={styles[positions[seat] ?? 'top']}>
          <CardFace card={card} />
        </li>
      ))}
    </ol>
  );
}
