import { LABEL, type LabelPreset } from './geometry';
import styles from './cards.module.css';

/**
 * A rank or number: `corner` for the corner index, `mini` for the large value of a mini card.
 * Two characters get a smaller size and tighter tracking (shifted to stay centred, since
 * tracking also follows the last glyph). `light` draws it in the card-face colour, over a
 * solid oudler badge or frame. `y` overrides the preset's baseline.
 */
export function IndexLabel({
  text,
  preset = 'corner',
  light = false,
  y,
}: {
  text: string;
  preset?: LabelPreset;
  light?: boolean;
  y?: number;
}) {
  const { x, y: baseline, font, fontWide, trackingWide } = LABEL[preset];
  const wide = text.length > 1;
  return (
    <text
      x={wide ? x - trackingWide / 2 : x}
      y={y ?? baseline}
      fontSize={wide ? fontWide : font}
      letterSpacing={wide ? trackingWide : undefined}
      className={`${styles.label} ${light ? styles.knockout : ''}`}
    >
      {text}
    </text>
  );
}
