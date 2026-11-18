import {
  INDEX_BASELINE,
  INDEX_FONT,
  INDEX_FONT_WIDE,
  INDEX_TRACKING_WIDE,
  INDEX_X,
} from './geometry';
import styles from './cards.module.css';

/**
 * The rank or number in a card's corner. Two characters get a smaller size and tighter
 * tracking (shifted to stay centred, since tracking also follows the last glyph). `light` draws
 * it in the card-face colour, over an oudler badge.
 */
export function IndexLabel({ text, light = false }: { text: string; light?: boolean }) {
  const wide = text.length > 1;
  return (
    <text
      x={wide ? INDEX_X - INDEX_TRACKING_WIDE / 2 : INDEX_X}
      y={INDEX_BASELINE}
      fontSize={wide ? INDEX_FONT_WIDE : INDEX_FONT}
      letterSpacing={wide ? INDEX_TRACKING_WIDE : undefined}
      className={`${styles.label} ${light ? styles.knockout : ''}`}
    >
      {text}
    </text>
  );
}
