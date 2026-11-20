import styles from './BidIcon.module.css';

/** Width and height of the drawing, in its own units. */
const W = 40;
const H = 30;
const CARD = { width: 14, height: 21, corner: 2 } as const;
/** How far above the fan's pivot the cards stand. */
const LIFT = 3;
/** Angle between two cards of the fan, in degrees. */
const SPREAD = 14;

/**
 * A contract's mark (DESIGN.md §4: drawn, no third-party icon): a fan of `cards` cards, one to
 * four from the Petite to the Garde contre, so the contracts read as rising.
 */
export function BidIcon({ cards }: { cards: number }) {
  const pivot = { x: W / 2, y: H - 1 };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.icon} aria-hidden>
      {Array.from({ length: cards }, (_, i) => {
        const angle = (i - (cards - 1) / 2) * SPREAD;
        return (
          <rect
            key={i}
            x={pivot.x - CARD.width / 2}
            y={pivot.y - CARD.height - LIFT}
            width={CARD.width}
            height={CARD.height}
            rx={CARD.corner}
            transform={`rotate(${angle} ${pivot.x} ${pivot.y})`}
            className={styles.card}
          />
        );
      })}
    </svg>
  );
}
