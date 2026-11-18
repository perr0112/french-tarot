import type { Suit } from '@tarot/engine';
import { CENTER_X, COURT_BEAD_R, COURT_HEAD_R, COURT_HEAD_Y, COURT_PIP } from './geometry';
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
interface Figure {
  /** Filled silhouette parts (besides the head), one path. */
  body: string;
  /** Parts drawn with the even-odd rule (openings). */
  hollow?: string;
  /** Bead centres (the Dame's tiara). */
  beads?: readonly (readonly [number, number])[];
}

const FIGURES: Record<number, Figure> = {
  11: {
    body: 'M40 43 64 38V42.5L40 47.5ZM40 132V73A10 10 0 0 1 60 73V132Z',
  },
  12: {
    body: 'M46 40 61 28 55 42ZM42 62H58L61 91H39Z',
    hollow: 'M22 132V108A28 18 0 0 1 78 108V132ZM35 132V117H65V132Z',
  },
  13: {
    body: 'M44 69H56L76 132H24Z',
    beads: [
      [40, 46],
      [50, 42],
      [60, 46],
    ],
  },
  14: {
    body: 'M36 51V36L43 43 50 31 57 43 64 36V51ZM26 132 30 72H70L74 132Z',
  },
};

export function CourtFigure({ suit, rank }: { suit: Suit; rank: number }) {
  const figure = FIGURES[rank];
  const headY = COURT_HEAD_Y[rank];
  const pip = COURT_PIP[rank];
  if (!figure || headY === undefined || !pip) return null;
  return (
    <>
      <circle cx={CENTER_X} cy={headY} r={COURT_HEAD_R} />
      <path d={figure.body} />
      {figure.hollow && <path d={figure.hollow} fillRule="evenodd" />}
      {figure.beads?.map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r={COURT_BEAD_R} />
      ))}
      <Pip suit={suit} cx={CENTER_X} cy={pip.cy} size={pip.size} className={styles.knockout} />
    </>
  );
}
