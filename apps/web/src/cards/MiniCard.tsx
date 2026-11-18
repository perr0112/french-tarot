import type { Suit } from '@tarot/engine';
import { star } from './ExcuseCard';
import {
  CARD_H,
  CARD_W,
  CENTER_X,
  CENTER_Y,
  EXCUSE_STAR,
  MINI_EXCUSE,
  MINI_LABEL_BASELINE,
  MINI_LABEL_FONT,
  MINI_LABEL_FONT_WIDE,
  MINI_LABEL_TRACKING_WIDE,
  MINI_PIP,
  MINI_TRUMP_FRAME,
  MINI_TRUMP_NUMBER_BASELINE,
} from './geometry';
import { Pip } from './Pip';
import styles from './cards.module.css';

const OUDLER_TRUMPS: ReadonlySet<number> = new Set([1, 21]);

/** One large label; two characters are set smaller and tighter. */
function MiniLabel({
  text,
  y,
  className,
}: {
  text: string;
  y: number;
  className?: string | undefined;
}) {
  const wide = text.length > 1;
  return (
    <text
      x={wide ? CENTER_X - MINI_LABEL_TRACKING_WIDE / 2 : CENTER_X}
      y={y}
      fontSize={wide ? MINI_LABEL_FONT_WIDE : MINI_LABEL_FONT}
      letterSpacing={wide ? MINI_LABEL_TRACKING_WIDE : undefined}
      className={`${styles.label} ${className ?? ''}`}
    >
      {text}
    </text>
  );
}

/** Mini suit card: the rank above one large pip. */
export function MiniSuitCard({ suit, label }: { suit: Suit; label: string }) {
  return (
    <g className={suit === 'H' || suit === 'D' ? styles.red : styles.black}>
      <MiniLabel text={label} y={MINI_LABEL_BASELINE} />
      <Pip suit={suit} cx={CENTER_X} cy={MINI_PIP.cy} size={MINI_PIP.size} />
    </g>
  );
}

/**
 * Mini trump: the number inside a heavy trump frame. The Petit and the 21 fill the frame
 * (the oudler badge, scaled up) and show the number light.
 */
export function MiniTrumpCard({ value }: { value: number }) {
  const { inset, radius, stroke } = MINI_TRUMP_FRAME;
  const oudler = OUDLER_TRUMPS.has(value);
  return (
    <g className={styles.ink}>
      <rect
        x={inset}
        y={inset}
        width={CARD_W - 2 * inset}
        height={CARD_H - 2 * inset}
        rx={radius}
        strokeWidth={stroke}
        className={oudler ? styles.ink : styles.miniFrame}
      />
      <MiniLabel
        text={String(value)}
        y={MINI_TRUMP_NUMBER_BASELINE}
        className={oudler ? styles.knockout : undefined}
      />
    </g>
  );
}

/** Mini Excuse: the solid disc and its star, enlarged. */
export function MiniExcuseCard() {
  return (
    <g className={styles.ink}>
      <circle cx={CENTER_X} cy={CENTER_Y} r={MINI_EXCUSE.r} />
      <polygon
        points={star(CENTER_X, CENTER_Y, MINI_EXCUSE.outer, MINI_EXCUSE.inner, EXCUSE_STAR.points)}
        className={styles.knockout}
      />
    </g>
  );
}
