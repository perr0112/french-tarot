import { EXCUSE, isOudler, suitOf, trumpValue, type Card } from '@tarot/engine';
import { useId } from 'react';
import {
  backScan,
  CornerIndex,
  faceScan,
  MiniExcuseCard,
  MiniSuitCard,
  MiniTrumpCard,
  type IndexContent,
} from '../cards';
import {
  CARD_H,
  CARD_RADIUS,
  CARD_W,
  EDGE_INSET,
  EDGE_STROKE,
  SCAN_BLEED,
} from '../cards/geometry';
import { cardName, cornerLabel } from '../lib/cards';
import { fr } from '../strings/fr';
import styles from './Card.module.css';

const VIEW_BOX = `0 0 ${CARD_W} ${CARD_H}`;

/** Default: the scanned card with its corner index. Mini (32–40 px strips): one value, one mark. */
type CardSize = 'full' | 'mini';

/** The card's outline; its stroke stays inside the card. */
function Edge({ className }: { className: string | undefined }) {
  return (
    <rect
      x={EDGE_INSET}
      y={EDGE_INSET}
      width={CARD_W - 2 * EDGE_INSET}
      height={CARD_H - 2 * EDGE_INSET}
      rx={CARD_RADIUS - EDGE_INSET}
      strokeWidth={EDGE_STROKE}
      className={className}
    />
  );
}

/** A scan, clipped to the card's outline, its paper margin cut off (SCAN_BLEED). */
function Scan({ href }: { href: string }) {
  const clip = useId();
  return (
    <>
      <clipPath id={clip}>
        <rect width={CARD_W} height={CARD_H} rx={CARD_RADIUS} />
      </clipPath>
      <image
        href={href}
        x={-SCAN_BLEED}
        y={-SCAN_BLEED}
        width={CARD_W + 2 * SCAN_BLEED}
        height={CARD_H + 2 * SCAN_BLEED}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clip})`}
      />
    </>
  );
}

/** What a card's corner index shows. */
function indexOf(card: Card): IndexContent {
  if (card === EXCUSE) return { kind: 'excuse' };
  const trump = trumpValue(card);
  if (trump !== null) return { kind: 'trump', value: trump, oudler: isOudler(card) };
  const suit = suitOf(card);
  if (suit === null) throw new Error(`Not a card: ${card}`);
  return { kind: 'suit', suit, label: cornerLabel(card) };
}

function MiniArt({ index }: { index: IndexContent }) {
  if (index.kind === 'excuse') return <MiniExcuseCard />;
  if (index.kind === 'trump') return <MiniTrumpCard value={index.value} oudler={index.oudler} />;
  return <MiniSuitCard suit={index.suit} label={index.label} />;
}

/**
 * One card face (DESIGN.md §4): the Grimaud 1898 scan with a corner index over it, or in mini
 * mode a drawn value and mark. Sized by its container's width.
 */
export function CardFace({
  card,
  className,
  size = 'full',
}: {
  card: Card;
  className?: string;
  size?: CardSize;
}) {
  const index = indexOf(card);
  return (
    <svg
      viewBox={VIEW_BOX}
      className={`${styles.card} ${className ?? ''}`}
      role="img"
      aria-label={cardName(card)}
    >
      <Edge className={styles.face} />
      {size === 'mini' ? (
        <MiniArt index={index} />
      ) : (
        <>
          <Scan href={faceScan(card)} />
          <CornerIndex content={index} />
          <Edge className={styles.outline} />
        </>
      )}
    </svg>
  );
}

/** The back of a card: the same for every card, so it tells nothing (DESIGN.md §4). */
export function CardBack({ className }: { className?: string }) {
  return (
    <svg
      viewBox={VIEW_BOX}
      className={`${styles.card} ${className ?? ''}`}
      role="img"
      aria-label={fr.cards.hidden}
    >
      <Edge className={styles.back} />
      <Scan href={backScan} />
      <Edge className={styles.outline} />
    </svg>
  );
}
