import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { breakpoints } from '../design/tokens';
import { useAnimations, useSeason } from '../lib/theme';
import { SEASON_THEMES, type Drift } from '../themes/seasons';
import { DriftShape } from '../themes/shapes';
import styles from './SeasonalAmbience.module.css';

/** A media query's answer, following it as it changes (none outside a browser). */
function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (listener) => {
      const list = window.matchMedia?.(query);
      list?.addEventListener('change', listener);
      return () => list?.removeEventListener('change', listener);
    },
    () => window.matchMedia?.(query).matches ?? false,
  );
}

type Gsap = typeof import('gsap').gsap;

/** Sets one drifting thing on its way: falling from the top and swaying, or floating in place. */
function animate(gsap: Gsap, item: HTMLElement, drift: Drift, first: boolean): void {
  const body = item.firstElementChild as HTMLElement;
  const size = gsap.utils.random(drift.size[0], drift.size[1]);
  const seconds = gsap.utils.random(drift.seconds[0], drift.seconds[1]);
  const { innerWidth: width, innerHeight: height } = window;
  gsap.set(item, { width: size, height: size, x: gsap.utils.random(0, width) });
  if (!drift.falls) {
    // Fireflies: drift a little where they are, glowing and fading.
    gsap.set(item, { y: gsap.utils.random(0, height), opacity: 0 });
    gsap.to(item, {
      x: `+=${gsap.utils.random(-60, 60)}`,
      y: `+=${gsap.utils.random(-50, 50)}`,
      duration: seconds,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    gsap.to(item, {
      opacity: gsap.utils.random(0.5, 0.9),
      duration: seconds / 3,
      delay: gsap.utils.random(0, seconds),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      repeatDelay: gsap.utils.random(0, seconds / 2),
    });
    return;
  }
  // The first ones start anywhere on the screen, the next ones above it.
  const from = first ? gsap.utils.random(-size, height) : -size * 2;
  gsap.set(item, { y: from, opacity: gsap.utils.random(0.55, 0.95) });
  gsap.to(item, {
    y: height + size * 2,
    duration: seconds * ((height + size * 2 - from) / (height + size * 4)),
    ease: 'none',
    onComplete: () => animate(gsap, item, drift, false),
  });
  if (first) {
    // The sway and the spin go on for good, whatever the item's fall.
    gsap.to(body, {
      x: gsap.utils.random(-40, 40),
      duration: gsap.utils.random(2, 4),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    if (drift.spins) {
      gsap.fromTo(
        body,
        { rotation: gsap.utils.random(0, 360) },
        {
          rotation: `+=${gsap.utils.random(-270, 270)}`,
          duration: seconds,
          ease: 'none',
          repeat: -1,
        },
      );
    }
  }
}

/**
 * What drifts over the felt in each season (DESIGN.md §3.6): petals, fireflies, leaves or
 * snowflakes, behind the page and never in the way. Off when the player turns it off or the
 * system asks for less motion; half as many on a phone; paused while the page is hidden. GSAP
 * is loaded only when they show.
 */
export function SeasonalAmbience() {
  const season = useSeason();
  const on = useAnimations();
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const compact = useMedia(`(max-width: ${breakpoints.compact}px)`);
  const layer = useRef<HTMLDivElement>(null);
  const drift = SEASON_THEMES[season].drift;
  const count = on && !reduced ? (compact ? Math.ceil(drift.count / 2) : drift.count) : 0;

  useEffect(() => {
    const root = layer.current;
    if (count === 0 || !root) return;
    let stopped = false;
    let undo: (() => void) | null = null;
    void import('gsap').then(({ gsap }) => {
      if (stopped) return;
      const context = gsap.context(() => {
        root.querySelectorAll<HTMLElement>('[data-drift]').forEach((item) => {
          animate(gsap, item, drift, true);
        });
      }, root);
      // GSAP runs only these: its whole timeline rests while the page is hidden.
      const visibility = () => gsap.globalTimeline.paused(document.hidden);
      document.addEventListener('visibilitychange', visibility);
      undo = () => {
        document.removeEventListener('visibilitychange', visibility);
        context.revert();
      };
    });
    return () => {
      stopped = true;
      undo?.();
    };
  }, [count, drift]);

  if (count === 0) return null;
  return createPortal(
    <div ref={layer} className={styles.layer} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={`${season}-${i}`} className={styles.item} data-drift="">
          <span className={styles.body}>
            <DriftShape
              shape={drift.shape}
              color={drift.colors[i % drift.colors.length] ?? '#FFFFFF'}
            />
          </span>
        </span>
      ))}
    </div>,
    document.body,
  );
}
