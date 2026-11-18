import { CENTER_X, OUDLER_BADGE, OUDLER_DISC, TRUMP_FRAME } from './geometry';
import styles from './cards.module.css';

const FRAME_TOP = TRUMP_FRAME.y;
const FRAME_BOTTOM = TRUMP_FRAME.y + TRUMP_FRAME.height;

/** The bouts' frame mark (Petit, 21, Excuse): solid discs on the top and bottom centre line. */
export function OudlerMark() {
  return (
    <>
      {[FRAME_TOP, FRAME_BOTTOM].map((cy) => (
        <circle key={cy} cx={CENTER_X} cy={cy} r={OUDLER_DISC} className={styles.ink} />
      ))}
    </>
  );
}

/** The bouts' corner badge: a solid block behind the index, which is then drawn light. */
export function OudlerBadge() {
  const { x, y, width, height, radius } = OUDLER_BADGE;
  return <rect x={x} y={y} width={width} height={height} rx={radius} className={styles.ink} />;
}
