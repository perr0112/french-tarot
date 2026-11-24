import type { ReactNode } from 'react';
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
 * A corner flourish: a whiplash curve along the two edges, curled at both ends, in the manner
 * of the 1898 Grimaud deck, round a suit kept upright.
 */
function Ornament({ corner, suit }: { corner: Corner; suit: Suit }) {
  const right = corner === 'topRight' || corner === 'bottomRight';
  const bottom = corner === 'bottomLeft' || corner === 'bottomRight';
  return (
    <svg
      className={`${styles.ornament} ${styles[corner]}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
      data-corner={corner}
    >
      <g transform={MIRROR[corner]}>
        <g className={styles.lines}>
          <path d="M4 36 C4 18 18 4 36 4" />
          <path d="M36 4 c3.5 0 4.5 3.5 1.8 4.8 c-1.8 .9 -3.5 -.5 -2.6 -2.2" />
          <path d="M4 36 c0 3.5 3.5 4.5 4.8 1.8 c.9 -1.8 -.5 -3.5 -2.2 -2.6" />
          <path d="M11 33 C11 21 21 11 33 11" className={styles.thin} />
        </g>
        {/* The season's motif by the corner; only the page's season shows (Mat.module.css). */}
        <g className={`${styles.motif} ${styles.spring}`} transform="translate(-6 -6) scale(1.6)">
          <circle cx="10" cy="7" r="1.6" />
          <circle cx="13" cy="10" r="1.6" />
          <circle cx="10" cy="13" r="1.6" />
          <circle cx="7" cy="10" r="1.6" />
          <circle cx="10" cy="10" r="1" className={styles.heart} />
        </g>
        <g className={`${styles.motif} ${styles.summer}`} transform="translate(-6 -6) scale(1.6)">
          <circle cx="10" cy="10" r="2.4" />
          <path
            className={styles.rays}
            d="M10 5v1.6M10 13.4V15M5 10h1.6M13.4 10H15M6.5 6.5l1.1 1.1M12.4 12.4l1.1 1.1M6.5 13.5l1.1-1.1M12.4 7.6l1.1-1.1"
          />
        </g>
        <path
          className={`${styles.motif} ${styles.autumn}`}
          transform="translate(-6 -6) scale(1.6)"
          d="M6 6 q7 1 8 8 q-7 -1 -8 -8z"
        />
        <path
          className={`${styles.motif} ${styles.winter} ${styles.rays}`}
          transform="translate(-6 -6) scale(1.6)"
          d="M6 10h8M8 6.5l4 7M12 6.5l-4 7"
        />
      </g>
      <path
        className={styles.suit}
        d={SUIT_PATHS[suit]}
        transform={`translate(${right ? 14.5 : 23.5} ${bottom ? 14.5 : 23.5}) scale(1)`}
      />
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
  return (
    <div className={`${styles.mat} ${className ?? ''}`}>
      {CORNERS.map(({ corner, suit }) => (
        <Ornament key={corner} corner={corner} suit={suit} />
      ))}
      {children}
    </div>
  );
}
