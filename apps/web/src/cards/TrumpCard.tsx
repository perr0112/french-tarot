import {
  CENTER_X,
  INDEX_MARK_Y,
  INDEX_X,
  LINE,
  TRUMP_FRAME,
  TRUMP_INDEX_MARK,
  TRUMP_NUMBER_BASELINE,
  TRUMP_NUMBER_FONT,
  TRUMP_RULE,
} from './geometry';
import { IndexLabel } from './IndexLabel';
import { OudlerBadge, OudlerMark } from './OudlerMark';
import { BothCorners } from './Pip';
import styles from './cards.module.css';

const OUDLER_TRUMPS: ReadonlySet<number> = new Set([1, 21]);

/**
 * A trump (1–21): the number is the hero, inside a tall frame shared by all trumps. In the
 * corner, a solid miniature of that frame stands where suit cards show their pip. The Petit and the
 * 21 add the oudler marks: a solid corner badge and discs on the frame.
 */
export function TrumpCard({ value }: { value: number }) {
  const oudler = OUDLER_TRUMPS.has(value);
  const { width, height, radius } = TRUMP_INDEX_MARK;
  return (
    <g className={styles.ink}>
      <rect
        x={TRUMP_FRAME.x}
        y={TRUMP_FRAME.y}
        width={TRUMP_FRAME.width}
        height={TRUMP_FRAME.height}
        rx={TRUMP_FRAME.radius}
        strokeWidth={LINE}
        className={styles.frame}
      />
      {[TRUMP_RULE.top, TRUMP_RULE.bottom].map((y) => (
        <line
          key={y}
          x1={TRUMP_RULE.x1}
          x2={TRUMP_RULE.x2}
          y1={y}
          y2={y}
          strokeWidth={LINE}
          className={styles.frame}
        />
      ))}
      <BothCorners>
        {oudler && <OudlerBadge />}
        <IndexLabel text={String(value)} light={oudler} />
        <rect
          x={INDEX_X - width / 2}
          y={INDEX_MARK_Y - height / 2}
          width={width}
          height={height}
          rx={radius}
        />
      </BothCorners>
      <text
        x={CENTER_X}
        y={TRUMP_NUMBER_BASELINE}
        fontSize={TRUMP_NUMBER_FONT}
        className={styles.label}
      >
        {value}
      </text>
      {oudler && <OudlerMark />}
    </g>
  );
}
