import type { Suit } from '@tarot/engine';
import {
  CARD_H,
  CARD_W,
  CENTER_X,
  CENTER_Y,
  EXCUSE_STAR_POINTS,
  MINI_EXCUSE_STAR,
  MINI_PIP,
  MINI_TRUMP_FRAME,
  MINI_TRUMP_NUMBER_BASELINE,
} from './geometry';
import { IndexLabel } from './IndexLabel';
import { Pip } from './Pip';
import { star, suitClass } from './shapes';
import styles from './cards.module.css';

/** Mini suit card: the rank above one large pip. */
export function MiniSuitCard({ suit, label }: { suit: Suit; label: string }) {
  return (
    <g className={suitClass(suit)}>
      <IndexLabel text={label} preset="mini" />
      <Pip suit={suit} cx={CENTER_X} cy={MINI_PIP.cy} size={MINI_PIP.size} />
    </g>
  );
}

/** The heavy mini trump frame; filled solid for the oudlers (the corner badge, scaled up). */
function MiniFrame({ solid }: { solid: boolean }) {
  const { inset, radius, stroke } = MINI_TRUMP_FRAME;
  return (
    <rect
      x={inset}
      y={inset}
      width={CARD_W - 2 * inset}
      height={CARD_H - 2 * inset}
      rx={radius}
      strokeWidth={stroke}
      className={solid ? styles.ink : styles.frame}
    />
  );
}

/** Mini trump: the number inside the frame; the Petit and the 21 fill it and show it light. */
export function MiniTrumpCard({ value, oudler }: { value: number; oudler: boolean }) {
  return (
    <g className={styles.ink}>
      <MiniFrame solid={oudler} />
      <IndexLabel
        text={String(value)}
        preset="mini"
        y={MINI_TRUMP_NUMBER_BASELINE}
        light={oudler}
      />
    </g>
  );
}

/** Mini Excuse: marked as an oudler like the mini Petit and 21, with its star cut out. */
export function MiniExcuseCard() {
  return (
    <g className={styles.ink}>
      <MiniFrame solid />
      <polygon
        points={star(
          CENTER_X,
          CENTER_Y,
          MINI_EXCUSE_STAR.outer,
          MINI_EXCUSE_STAR.inner,
          EXCUSE_STAR_POINTS,
        )}
        className={styles.knockout}
      />
    </g>
  );
}
