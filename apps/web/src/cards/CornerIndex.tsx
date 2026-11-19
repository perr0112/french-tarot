import type { Suit } from '@tarot/engine';
import {
  EXCUSE_INDEX_STAR,
  EXCUSE_STAR_POINTS,
  INDEX_MARK_SIZE,
  INDEX_MARK_Y,
  INDEX_PLATE,
  INDEX_X,
  OUDLER_BADGE,
  TRUMP_INDEX_MARK,
} from './geometry';
import { IndexLabel } from './IndexLabel';
import { Pip } from './Pip';
import { star, suitClass } from './shapes';
import styles from './cards.module.css';

/** What the corner index shows: a suit card's rank and suit, a trump's number, the Excuse. */
export type IndexContent =
  | { kind: 'suit'; suit: Suit; label: string }
  | { kind: 'trump'; value: number; oudler: boolean }
  | { kind: 'excuse' };

/** The light cartouche the index stands on, over the scan. */
function Plate() {
  const { x, y, width, height, radius } = INDEX_PLATE;
  return <rect x={x} y={y} width={width} height={height} rx={radius} className={styles.plate} />;
}

/** The bouts' corner badge: a solid block behind the index, which is then drawn light. */
function OudlerBadge() {
  const { x, y, width, height, radius } = OUDLER_BADGE;
  return <rect x={x} y={y} width={width} height={height} rx={radius} className={styles.ink} />;
}

/**
 * The top-left index drawn over a scan, the part of a card that shows in the fan: rank above
 * suit pip; trump number above a small frame; the oudlers on a solid badge (the Excuse: a star).
 */
export function CornerIndex({ content }: { content: IndexContent }) {
  if (content.kind === 'suit') {
    const { suit, label } = content;
    return (
      <g className={suitClass(suit)}>
        <Plate />
        <IndexLabel text={label} />
        <Pip suit={suit} cx={INDEX_X} cy={INDEX_MARK_Y} size={INDEX_MARK_SIZE} />
      </g>
    );
  }
  if (content.kind === 'excuse') {
    return (
      <g className={styles.ink}>
        <Plate />
        <OudlerBadge />
        <polygon
          points={star(
            INDEX_X,
            EXCUSE_INDEX_STAR.cy,
            EXCUSE_INDEX_STAR.outer,
            EXCUSE_INDEX_STAR.inner,
            EXCUSE_STAR_POINTS,
          )}
          className={styles.knockout}
        />
      </g>
    );
  }
  const { value, oudler } = content;
  const { width, height, radius } = TRUMP_INDEX_MARK;
  return (
    <g className={styles.ink}>
      <Plate />
      {oudler && <OudlerBadge />}
      <IndexLabel text={String(value)} light={oudler} />
      <rect
        x={INDEX_X - width / 2}
        y={INDEX_MARK_Y - height / 2}
        width={width}
        height={height}
        rx={radius}
      />
    </g>
  );
}
