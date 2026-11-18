import {
  BACK_CORE,
  BACK_INNER_RADIUS,
  BACK_INSET,
  BACK_RINGS,
  CARD_H,
  CARD_W,
  CENTER_X,
  CENTER_Y,
  LINE,
} from './geometry';
import styles from './cards.module.css';

/**
 * The back's drawing, over a `card-back` field: an inset line and concentric rings around a
 * solid core. Point-symmetric, so it looks the same either way up, and identical for every card.
 */
export function CardBackArt() {
  return (
    <>
      <rect
        x={BACK_INSET}
        y={BACK_INSET}
        width={CARD_W - 2 * BACK_INSET}
        height={CARD_H - 2 * BACK_INSET}
        rx={BACK_INNER_RADIUS}
        strokeWidth={LINE}
        className={styles.backLine}
      />
      {BACK_RINGS.map((r) => (
        <circle
          key={r}
          cx={CENTER_X}
          cy={CENTER_Y}
          r={r}
          strokeWidth={LINE}
          className={styles.backLine}
        />
      ))}
      <circle cx={CENTER_X} cy={CENTER_Y} r={BACK_CORE} className={styles.backCore} />
    </>
  );
}
