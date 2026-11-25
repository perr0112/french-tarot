import type { ReactNode } from 'react';
import { useSeason } from '../lib/theme';
import type { Season } from '../themes/seasons';
import { SeasonMotif } from '../themes/shapes';
import styles from './Mat.module.css';

type Corner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

type Suit = 'spade' | 'heart' | 'club' | 'diamond';

/** One suit per corner, as the four suits of the deck go round the table. */
const CORNERS: readonly { corner: Corner; suit: Suit }[] = [
  { corner: 'topLeft', suit: 'spade' },
  { corner: 'topRight', suit: 'heart' },
  { corner: 'bottomRight', suit: 'club' },
  { corner: 'bottomLeft', suit: 'diamond' },
];

/** The suits drawn in a 10 × 10 box (not font glyphs, which some systems turn into emoji). */
const SUIT_PATHS: Readonly<Record<Suit, string>> = {
  spade:
    'M5 0C3 3 0 4.5 0 6.6 0 8 1.1 9 2.4 9c.9 0 1.6-.4 2.1-1L4 10h2l-.5-2c.5.6 1.2 1 2.1 1C8.9 9 10 8 10 6.6 10 4.5 7 3 5 0Z',
  heart:
    'M5 9.5C1 6.5 0 4.4 0 2.8 0 1.2 1.2 0 2.6 0 3.7 0 4.5.7 5 1.6 5.5.7 6.3 0 7.4 0 8.8 0 10 1.2 10 2.8c0 1.6-1 3.7-5 6.7Z',
  club: 'M5 .4a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 1 1 0-4.6ZM2.4 3.8a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 1 1 0-4.6ZM7.6 3.8a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 1 1 0-4.6ZM4.4 6 4 10h2l-.4-4Z',
  diamond: 'M5 0 9 5 5 10 1 5Z',
};

/** How the top left flourish is mirrored into each corner (in the 48 × 48 view box). */
const MIRROR: Readonly<Record<Corner, string | undefined>> = {
  topLeft: undefined,
  topRight: 'translate(48 0) scale(-1 1)',
  bottomRight: 'translate(48 48) scale(-1 -1)',
  bottomLeft: 'translate(0 48) scale(1 -1)',
};

/**
 * A corner ornament in the manner of the 1898 Grimaud deck: a medallion round a suit, whiplash
 * flourishes along the mat's edges, the season's motif in the corner.
 */
function Ornament({ corner, suit, season }: { corner: Corner; suit: Suit; season: Season }) {
  return (
    <svg
      className={`${styles.ornament} ${styles[corner]}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
      data-corner={corner}
    >
      {/* A medallion in the middle of the box, the suit exactly at its centre: the same in
          every corner, so all four line up. */}
      <g className={styles.lines}>
        <circle cx="24" cy="24" r="11" />
        <circle cx="24" cy="24" r="8.5" className={styles.thin} />
      </g>
      <path className={styles.suit} d={SUIT_PATHS[suit]} transform="translate(19 19)" />
      {/* Its flourishes run along the mat's two edges, curling at their ends; the season's motif
          sits in the corner between them (mirrored for each corner). */}
      <g transform={MIRROR[corner]}>
        <g className={styles.lines}>
          <path d="M16.5 31.5 C11 37 8 41 4.5 45.5" />
          <path d="M4.5 45.5 c-2 -1 -2 -4 0.5 -4.5 c1.6 -0.3 2.4 1.4 1.2 2.2" />
          <path d="M31.5 16.5 C37 11 41 8 45.5 4.5" />
          <path d="M45.5 4.5 c-1 -2 -4 -2 -4.5 0.5 c-0.3 1.6 1.4 2.4 2.2 1.2" />
        </g>
        <g className={styles.motif} transform="translate(1 1) scale(0.75)">
          <SeasonMotif season={season} />
        </g>
      </g>
    </svg>
  );
}

/**
 * The mat in the middle of the green felt, where the cards are laid (DESIGN.md §2, §3.1): a
 * stitched edge and, at each corner, a flourish round a suit with the season's motif.
 */
export function Mat({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  const season = useSeason();
  return (
    <div className={`${styles.mat} ${className ?? ''}`}>
      {CORNERS.map(({ corner, suit }) => (
        <Ornament key={corner} corner={corner} suit={suit} season={season} />
      ))}
      {children}
    </div>
  );
}
