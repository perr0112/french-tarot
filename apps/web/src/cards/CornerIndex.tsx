import type { Suit } from '@tarot/engine';
import {
  CARD_H,
  CARD_W,
  EXCUSE_INDEX_STAR,
  EXCUSE_STAR_POINTS,
  INDEX_MARK_SIZE,
  INDEX_MARK_Y,
  INDEX_PLATE,
  INDEX_X,
  OUDLER_BADGE,
  TRUMP_BAND,
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

/** The bouts' badge: a solid block behind the index, which is then drawn light. */
function OudlerBadge() {
  const { x, y, width, height, radius } = OUDLER_BADGE;
  return <rect x={x} y={y} width={width} height={height} rx={radius} className={styles.ink} />;
}

/**
 * Paper bands over a trump's printed numbers, each closed by an ink rule, with our number upright
 * at the left of the top band and the right of the bottom one (moved, never turned).
 */
function TrumpBands({ value, oudler }: { value: number; oudler: boolean }) {
  const { height, rule } = TRUMP_BAND;
  const bottom = CARD_H - height;
  const number = (
    <>
      {oudler && <OudlerBadge />}
      <IndexLabel text={String(value)} preset="trump" light={oudler} />
    </>
  );
  return (
    <>
      <rect width={CARD_W} height={height} className={styles.paper} />
      <rect y={height - rule} width={CARD_W} height={rule} />
      <rect y={bottom} width={CARD_W} height={height} className={styles.paper} />
      <rect y={bottom} width={CARD_W} height={rule} />
      {number}
      <g transform={`translate(${CARD_W - 2 * OUDLER_BADGE.x - OUDLER_BADGE.width} ${bottom})`}>
        {number}
      </g>
    </>
  );
}

/**
 * The index drawn over a scan, top-left (the part of a card that shows in the fan): rank above
 * suit pip on a paper cartouche; a trump's number in paper bands at both ends; the oudlers on a
 * solid badge (the Excuse: a star).
 */
export function CornerIndex({ content }: { content: IndexContent }) {
  if (content.kind === 'suit') {
    const { suit, label } = content;
    const { x, y, width, height, radius } = INDEX_PLATE;
    return (
      <g className={suitClass(suit)}>
        <rect x={x} y={y} width={width} height={height} rx={radius} className={styles.paper} />
        <IndexLabel text={label} />
        <Pip suit={suit} cx={INDEX_X} cy={INDEX_MARK_Y} size={INDEX_MARK_SIZE} />
      </g>
    );
  }
  if (content.kind === 'excuse') {
    const { x, y, width, height } = OUDLER_BADGE;
    return (
      <g className={styles.ink}>
        <OudlerBadge />
        <polygon
          points={star(
            x + width / 2,
            y + height / 2,
            EXCUSE_INDEX_STAR.outer,
            EXCUSE_INDEX_STAR.inner,
            EXCUSE_STAR_POINTS,
          )}
          className={styles.knockout}
        />
      </g>
    );
  }
  return (
    <g className={styles.ink}>
      <TrumpBands {...content} />
    </g>
  );
}
