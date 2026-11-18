import { CENTER_X, EXCUSE_DISC, EXCUSE_INDEX_STAR, EXCUSE_STAR, INDEX_X } from './geometry';
import { OudlerBadge, OudlerMark } from './OudlerMark';
import { BothCorners } from './Pip';
import styles from './cards.module.css';

/** An n-point star as polygon points. */
export function star(cx: number, cy: number, outer: number, inner: number, n = EXCUSE_STAR.points) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / n - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/**
 * The Excuse: no number, no frame, no pip — a solid disc with a star cut out of it, and the
 * oudler marks (its name is the accessible label). In the corner, a small light star on the oudler badge (no rank).
 */
export function ExcuseCard() {
  return (
    <g className={styles.ink}>
      <BothCorners>
        <OudlerBadge />
        <polygon
          points={star(
            INDEX_X,
            EXCUSE_INDEX_STAR.cy,
            EXCUSE_INDEX_STAR.outer,
            EXCUSE_INDEX_STAR.inner,
          )}
          className={styles.knockout}
        />
      </BothCorners>
      <circle cx={CENTER_X} cy={EXCUSE_DISC.cy} r={EXCUSE_DISC.r} />
      <polygon
        points={star(CENTER_X, EXCUSE_DISC.cy, EXCUSE_STAR.outer, EXCUSE_STAR.inner)}
        className={styles.knockout}
      />
      <OudlerMark />
    </g>
  );
}
