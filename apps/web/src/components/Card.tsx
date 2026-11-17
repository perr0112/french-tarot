import { EXCUSE, isTrump, rankOf, suitOf, trumpValue, type Card, type Suit } from '@tarot/engine';
import { cardName, cornerLabel } from '../lib/cards';
import styles from './Card.module.css';

/** Suit symbols drawn in a 20×20 box (no font glyphs, which may render as emoji). */
function SuitShape({ suit, x, y, size }: { suit: Suit; x: number; y: number; size: number }) {
  const scale = size / 20;
  const shape = {
    S: (
      <path d="M10 1C10 1 1 7.5 1 12c0 2.8 2.2 4.5 4.6 4.5 1.8 0 3.2-.9 3.8-2.1L8 19h4l-1.4-4.6c.6 1.2 2 2.1 3.8 2.1 2.4 0 4.6-1.7 4.6-4.5C19 7.5 10 1 10 1Z" />
    ),
    H: (
      <path d="M10 18S1 12 1 6.5C1 3.5 3.5 1.5 6 1.5c1.8 0 3.2 1.1 4 2.5.8-1.4 2.2-2.5 4-2.5 2.5 0 5 2 5 5C19 12 10 18 10 18Z" />
    ),
    D: <path d="M10 0.5 18 10 10 19.5 2 10Z" />,
    C: (
      <>
        <circle cx="10" cy="5.6" r="4.3" />
        <circle cx="5" cy="11.6" r="4.3" />
        <circle cx="15" cy="11.6" r="4.3" />
        <path d="M9 11.5 7.4 19h5.2L11 11.5Z" />
      </>
    ),
  }[suit];
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>{shape}</g>;
}

const RED: ReadonlySet<Suit> = new Set(['H', 'D']);

function SuitCardFace({ card }: { card: Card }) {
  const suit = suitOf(card) as Suit;
  const rank = rankOf(card) ?? 0;
  const label = cornerLabel(card);
  const court = rank > 10;
  const corner = (
    <>
      <text x="10" y="22" className={styles.index}>
        {label}
      </text>
      <SuitShape suit={suit} x={4.5} y={27} size={11} />
    </>
  );
  return (
    <g className={RED.has(suit) ? styles.red : styles.black}>
      {corner}
      <g transform="rotate(180 50 80)">{corner}</g>
      {court ? (
        <>
          <text x="50" y="84" className={styles.court}>
            {label}
          </text>
          <SuitShape suit={suit} x={38} y={92} size={24} />
        </>
      ) : (
        <SuitShape suit={suit} x={32} y={62} size={36} />
      )}
    </g>
  );
}

function TrumpFace({ card }: { card: Card }) {
  const n = trumpValue(card) ?? 0;
  return (
    <g className={styles.trump}>
      <rect x="14" y="14" width="72" height="132" rx="4" className={styles.trumpFrame} />
      <text x="10" y="22" className={styles.index}>
        {n}
      </text>
      <text x="90" y="146" className={styles.index} transform="rotate(180 90 140)">
        {n}
      </text>
      <text x="50" y="94" className={styles.trumpNumber}>
        {n}
      </text>
    </g>
  );
}

function ExcuseFace() {
  // An eight-point star in a ring: unlike any trump number or suit symbol.
  const points = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? 26 : 11;
    const a = (Math.PI * i) / 8 - Math.PI / 2;
    return `${50 + r * Math.cos(a)},${80 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <g className={styles.excuse}>
      <circle cx="50" cy="80" r="34" className={styles.excuseRing} />
      <polygon points={points} />
      <text x="50" y="140" className={styles.excuseLabel}>
        Excuse
      </text>
    </g>
  );
}

/** One card face, 5:8, original art (DESIGN.md §4). Sized by its container's width. */
export function CardFace({ card, className }: { card: Card; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 160"
      className={`${styles.card} ${className ?? ''}`}
      role="img"
      aria-label={cardName(card)}
    >
      <rect x="1" y="1" width="98" height="158" rx="8" className={styles.face} />
      {card === EXCUSE ? (
        <ExcuseFace />
      ) : isTrump(card) ? (
        <TrumpFace card={card} />
      ) : (
        <SuitCardFace card={card} />
      )}
    </svg>
  );
}
