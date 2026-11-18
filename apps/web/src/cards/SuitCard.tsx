import type { Suit } from '@tarot/engine';
import { CourtFigure } from './CourtFigure';
import {
  ACE_SIZE,
  CENTER_X,
  CENTER_Y,
  INDEX_MARK_SIZE,
  INDEX_MARK_Y,
  INDEX_X,
  PIP_BOTTOM,
  PIP_COLUMNS,
  PIP_COLUMNS_DENSE,
  PIP_SIZE,
  PIP_SIZE_DENSE,
  PIP_TOP,
} from './geometry';
import { IndexLabel } from './IndexLabel';
import { BothCorners, Pip } from './Pip';
import styles from './cards.module.css';

const { left: L, centre: C, right: R } = PIP_COLUMNS;
const { left: DL, centre: DC, right: DR } = PIP_COLUMNS_DENSE;
/** Row heights: three rows (top, middle, bottom) or four evenly spaced rows. */
const ROW3 = [PIP_TOP, CENTER_Y, PIP_BOTTOM] as const;
const STEP4 = (PIP_BOTTOM - PIP_TOP) / 3;
const ROW4 = [0, 1, 2, 3].map((i) => PIP_TOP + i * STEP4);
const QUARTER = (CENTER_Y - PIP_TOP) / 2;

type Point = readonly [number, number];
const pair = (y: number): Point[] => [
  [L, y],
  [R, y],
];
const densePair = (y: number): Point[] => [
  [DL, y],
  [DR, y],
];
const denseTriple = (y: number): Point[] => [...densePair(y), [DC, y]];

/**
 * Pip layouts for 2–10, symmetric about the card's centre. Nine is a 3×3 grid and ten reads
 * 2-3-3-2 on four rows: rows the eye counts at once, no pip squeezed between two others.
 */
const LAYOUTS: Record<number, Point[]> = {
  2: [
    [C, PIP_TOP],
    [C, PIP_BOTTOM],
  ],
  3: ROW3.map((y) => [C, y] as Point),
  4: [...pair(PIP_TOP), ...pair(PIP_BOTTOM)],
  5: [...pair(PIP_TOP), [C, CENTER_Y], ...pair(PIP_BOTTOM)],
  6: ROW3.flatMap(pair),
  7: [...ROW3.flatMap(pair), [C, PIP_TOP + QUARTER]],
  8: [...ROW3.flatMap(pair), [C, PIP_TOP + QUARTER], [C, PIP_BOTTOM - QUARTER]],
  9: ROW3.flatMap(denseTriple),
  10: ROW4.flatMap((y, i) => (i === 0 || i === 3 ? densePair(y) : denseTriple(y))),
};
/** Ranks drawn with the dense columns and smaller pips. */
const DENSE: ReadonlySet<number> = new Set([9, 10]);

const colour = (suit: Suit) => (suit === 'H' || suit === 'D' ? styles.red : styles.black);

/** Rank above suit pip, top-left and (turned) bottom-right. */
function SuitCorners({ suit, label }: { suit: Suit; label: string }) {
  return (
    <BothCorners>
      <IndexLabel text={label} />
      <Pip suit={suit} cx={INDEX_X} cy={INDEX_MARK_Y} size={INDEX_MARK_SIZE} />
    </BothCorners>
  );
}

/** A numbered suit card (1–10): the pip count is the drawing. Lower-half pips face down. */
export function PipCard({ suit, rank, label }: { suit: Suit; rank: number; label: string }) {
  const pips: Point[] = rank === 1 ? [[CENTER_X, CENTER_Y]] : (LAYOUTS[rank] ?? []);
  const size = rank === 1 ? ACE_SIZE : DENSE.has(rank) ? PIP_SIZE_DENSE : PIP_SIZE;
  return (
    <g className={colour(suit)}>
      <SuitCorners suit={suit} label={label} />
      {pips.map(([x, y]) => (
        <Pip key={`${x}-${y}`} suit={suit} cx={x} cy={y} size={size} flip={y > CENTER_Y} />
      ))}
    </g>
  );
}

/** A court card (11–14): one geometric silhouette per rank, the suit pip set into it. */
export function CourtCard({ suit, rank, label }: { suit: Suit; rank: number; label: string }) {
  return (
    <g className={colour(suit)}>
      <SuitCorners suit={suit} label={label} />
      <CourtFigure suit={suit} rank={rank} />
    </g>
  );
}
