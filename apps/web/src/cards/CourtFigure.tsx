import type { Suit } from '@tarot/engine';
import { Pip } from './Pip';
import styles from './cards.module.css';

/**
 * Court silhouettes, built from plain geometry and shared by the four suits. Every figure has
 * the same head and stands on the same base line; the rank is told by the outline alone:
 *  - Valet: a narrow round-topped column under a slanted flat cap,
 *  - Cavalier: a slim rider on a wide arch (the mount), a pennant above,
 *  - Dame: a bell under a tiara of three beads,
 *  - Roi: broad square shoulders under a three-point crown.
 * The suit pip is cut out of the body in the card-face colour.
 */
const HEAD_R = 8;
const HEAD_X = 50;

interface Figure {
  /** Head centre height. */
  headY: number;
  /** Filled silhouette parts (besides the head), one path. */
  body: string;
  /** Parts drawn with the even-odd rule (openings). */
  hollow?: string;
  /** Extra round parts (beads). */
  dots?: readonly (readonly [number, number, number])[];
  /** Cut-out pip: centre and size. */
  pip: readonly [number, number, number];
}

const FIGURES: Record<number, Figure> = {
  11: {
    headY: 53,
    body: 'M40 43 64 38V42.5L40 47.5ZM40 132V73A10 10 0 0 1 60 73V132Z',
    pip: [50, 102, 15],
  },
  12: {
    headY: 51,
    body: 'M46 40 61 28 55 42ZM42 62H58L61 91H39Z',
    hollow: 'M22 132V108A28 18 0 0 1 78 108V132ZM35 132V117H65V132Z',
    pip: [50, 104, 13],
  },
  13: {
    headY: 58,
    body: 'M44 69H56L76 132H24Z',
    dots: [
      [40, 46, 2.6],
      [50, 42, 2.6],
      [60, 46, 2.6],
    ],
    pip: [50, 112, 17],
  },
  14: {
    headY: 61,
    body: 'M36 51V36L43 43 50 31 57 43 64 36V51ZM26 132 30 72H70L74 132Z',
    pip: [50, 104, 22],
  },
};

export function CourtFigure({ suit, rank }: { suit: Suit; rank: number }) {
  const figure = FIGURES[rank];
  if (!figure) return null;
  const [px, py, size] = figure.pip;
  return (
    <>
      <circle cx={HEAD_X} cy={figure.headY} r={HEAD_R} />
      <path d={figure.body} />
      {figure.hollow && <path d={figure.hollow} fillRule="evenodd" />}
      {figure.dots?.map(([cx, cy, r]) => (
        <circle key={cx} cx={cx} cy={cy} r={r} />
      ))}
      <Pip suit={suit} cx={px} cy={py} size={size} className={styles.knockout} />
    </>
  );
}
