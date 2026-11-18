import { CENTER_X, EXCUSE_DISC, EXCUSE_INDEX_STAR, EXCUSE_STAR, INDEX_X } from './geometry';
import { OudlerBadge, OudlerMark } from './OudlerMark';
import { BothCorners, star } from './shapes';
import styles from './cards.module.css';

/**
 * The Excuse: no number, no frame, no pip — a solid disc with a star cut out of it, and the
 * oudler marks (its name is the accessible label). In the corner, a small light star on the
 * oudler badge (no rank).
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
            EXCUSE_STAR.points,
          )}
          className={styles.knockout}
        />
      </BothCorners>
      <circle cx={CENTER_X} cy={EXCUSE_DISC.cy} r={EXCUSE_DISC.r} />
      <polygon
        points={star(
          CENTER_X,
          EXCUSE_DISC.cy,
          EXCUSE_STAR.outer,
          EXCUSE_STAR.inner,
          EXCUSE_STAR.points,
        )}
        className={styles.knockout}
      />
      <OudlerMark />
    </g>
  );
}
