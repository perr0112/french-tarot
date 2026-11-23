import type { ReactNode } from 'react';
import styles from './Mat.module.css';

type Corner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

/** One suit per corner, as the four suits of the deck go round the table. */
const CORNERS: readonly { corner: Corner; suit: string }[] = [
  { corner: 'topLeft', suit: '♠' },
  { corner: 'topRight', suit: '♥' },
  { corner: 'bottomRight', suit: '♣' },
  { corner: 'bottomLeft', suit: '♦' },
];

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
function Ornament({ corner, suit }: { corner: Corner; suit: string }) {
  const right = corner === 'topRight' || corner === 'bottomRight';
  const bottom = corner === 'bottomLeft' || corner === 'bottomRight';
  return (
    <svg
      className={`${styles.ornament} ${styles[corner]}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
      data-corner={corner}
    >
      <g className={styles.lines} transform={MIRROR[corner]}>
        <path d="M6 40 C6 20 20 6 40 6" />
        <path d="M40 6 c4 0 5 4 2 5.5 c-2 1 -4 -0.5 -3 -2.5" />
        <path d="M6 40 c0 4 4 5 5.5 2 c1 -2 -0.5 -4 -2.5 -3" />
        <path d="M13 37 C13 24 24 13 37 13" className={styles.thin} />
        <path d="M10 10 l3 3 M10 10 l-1 4 M10 10 l4 -1" className={styles.thin} />
      </g>
      <text
        className={styles.suit}
        x={right ? 23 : 25}
        y={bottom ? 22 : 26}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {suit}
      </text>
    </svg>
  );
}

/**
 * The small brown mat in the middle of the wooden table, where the cards are laid (DESIGN.md
 * §2, §3.1): a stitched edge and a flourish with a suit at each corner.
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
