import ui from '../design/ui.module.css';
import { formatScore } from '../lib/cards';
import styles from './ScoreChip.module.css';

/**
 * The colour of a score by its sign (DESIGN.md §3.1), on a light surface: green won, red lost,
 * the surrounding ink for zero.
 */
export const scoreTone = (value: number) =>
  value > 0 ? ui.positive : value < 0 ? ui.negative : '';

/**
 * A score set on the felt like a chip (DESIGN.md §5): on its own light ground, so its green or
 * red reads on the table; the sign says it too.
 */
export function ScoreChip({
  value,
  label,
  className,
}: {
  value: number;
  /** What it is, for screen readers (e.g. "Score de la donne : +56"). */
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`${styles.chip} ${value > 0 ? styles.positive : value < 0 ? styles.negative : ''} ${className ?? ''}`}
      aria-label={label}
    >
      {formatScore(value)}
    </span>
  );
}
