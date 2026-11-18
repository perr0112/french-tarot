import { EXCUSE, rankOf, suitOf, trumpValue, type Card, type Suit } from '@tarot/engine';
import {
  CardBackArt,
  CourtCard,
  ExcuseCard,
  MiniExcuseCard,
  MiniSuitCard,
  MiniTrumpCard,
  PipCard,
  TrumpCard,
} from '../cards';
import { CARD_H, CARD_RADIUS, CARD_W, EDGE_INSET, EDGE_STROKE } from '../cards/geometry';
import { cardName, cornerLabel } from '../lib/cards';
import { fr } from '../strings/fr';
import styles from './Card.module.css';

const VIEW_BOX = `0 0 ${CARD_W} ${CARD_H}`;
const LAST_PIP_RANK = 10;

/** Default: full art with corner indices. Mini (32–40 px strips): one big value and one mark. */
export type CardSize = 'full' | 'mini';

/** The card's outline, filled with the face or back colour; its stroke stays inside the card. */
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

function Art({ card, size }: { card: Card; size: CardSize }) {
  const mini = size === 'mini';
  if (card === EXCUSE) return mini ? <MiniExcuseCard /> : <ExcuseCard />;
  const trump = trumpValue(card);
  if (trump !== null) return mini ? <MiniTrumpCard value={trump} /> : <TrumpCard value={trump} />;
  const suit = suitOf(card) as Suit;
  const rank = rankOf(card) ?? 0;
  const label = cornerLabel(card);
  if (mini) return <MiniSuitCard suit={suit} label={label} />;
  return rank > LAST_PIP_RANK ? (
    <CourtCard suit={suit} rank={rank} label={label} />
  ) : (
    <PipCard suit={suit} rank={rank} label={label} />
  );
}

/** One card face, 5:8, original art (DESIGN.md §4). Sized by its container's width. */
export function CardFace({
  card,
  className,
  size = 'full',
}: {
  card: Card;
  className?: string;
  size?: CardSize;
}) {
  return (
    <svg
      viewBox={VIEW_BOX}
      className={`${styles.card} ${className ?? ''}`}
      role="img"
      aria-label={cardName(card)}
    >
      <Edge className={styles.face} />
      <Art card={card} size={size} />
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
      <CardBackArt />
    </svg>
  );
}
