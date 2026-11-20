import ui from '../design/ui.module.css';
import { formatScore } from '../lib/cards';
import { scoreTone } from '../lib/score';
import styles from './ScoreChip.module.css';

/**
 * A score set on the felt like a chip (DESIGN.md §5): on its own light ground, so its green or
 * red reads on the table.
 */
export function ScoreChip({
  value,
  label,
  className,
}: {
  value: number;
  /** What it is, read instead of the bare number (e.g. "Score de la donne : +56"). */
  label?: string;
  className?: string;
}) {
  return (
    <span className={`${styles.chip} ${className ?? ''}`}>
      <span className={scoreTone(value)} aria-hidden={label ? true : undefined}>
        {formatScore(value)}
      </span>
      {label && <span className={ui.visuallyHidden}>{label}</span>}
    </span>
  );
}
