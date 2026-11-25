import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { breakpoints } from '../design/tokens';
import { loadGsap } from '../lib/gsap';
import { useMedia } from '../lib/media';
import { useAnimations, useSeason } from '../lib/theme';
import { SEASON_THEMES, type Drift } from '../themes/seasons';
import { DriftShape } from '../themes/shapes';
import styles from './SeasonalAmbience.module.css';

type Gsap = typeof import('gsap').gsap;
type Context = ReturnType<Gsap['context']>;

/**
 * A firefly: placed once, by share of the screen (so a resize keeps them spread), it wanders
 * to a new spot each time and flashes briefly, with long dark gaps.
 */
function float(gsap: Gsap, item: HTMLElement, drift: Drift): void {
  const size = gsap.utils.random(drift.size[0], drift.size[1]);
  gsap.set(item, {
    width: size,
    height: size,
    left: `${gsap.utils.random(0, 100)}%`,
    top: `${gsap.utils.random(0, 100)}%`,
    opacity: 0,
  });
  const wander = () => gsap.utils.random(-60, 60);
  gsap.to(item, {
    x: wander,
    y: wander,
    duration: gsap.utils.random(drift.seconds[0], drift.seconds[1]),
    ease: 'sine.inOut',
    repeat: -1,
    repeatRefresh: true,
  });
  gsap
    .timeline({ repeat: -1, delay: gsap.utils.random(0, 4), repeatRefresh: true })
    .to(item, { opacity: () => gsap.utils.random(0.6, 1), duration: 0.5, ease: 'power2.out' })
    .to(item, { opacity: 0, duration: 1.2, ease: 'sine.in' })
    .to({}, { duration: () => gsap.utils.random(1, 5) });
}

/**
 * A falling thing: from anywhere on the screen at first, from above it afterwards, swaying
 * from side to side round its line and turning, its face flipping as it goes (leaves, petals).
 * Each new fall is added to the context, so the context's revert ends them all.
 */
function fall(gsap: Gsap, context: Context, item: HTMLElement, drift: Drift, first: boolean) {
  const body = item.firstElementChild as HTMLElement;
  const size = gsap.utils.random(drift.size[0], drift.size[1]);
  const seconds = gsap.utils.random(drift.seconds[0], drift.seconds[1]);
  const { innerWidth: width, innerHeight: height } = window;
  const from = first ? gsap.utils.random(-size, height) : -size * 2;
  gsap.set(item, {
    width: size,
    height: size,
    x: gsap.utils.random(0, width),
    y: from,
    // Discreet: the text on the felt stays the focus.
    opacity: gsap.utils.random(0.35, 0.7),
  });
  gsap.to(item, {
    y: height + size * 2,
    duration: seconds * ((height + size * 2 - from) / (height + size * 4)),
    ease: 'none',
    onComplete: () => context.add(() => fall(gsap, context, item, drift, false)),
  });
  if (!first) return;
  // The sway, the tilt and the spin go on for good, whatever the item's fall.
  const sway = gsap.utils.random(15, 35);
  const swing = gsap.utils.random(2, 4);
  gsap.fromTo(
    body,
    { x: -sway, rotationZ: drift.spins ? -15 : 0 },
    {
      x: sway,
      rotationZ: drift.spins ? 15 : 0,
      duration: swing,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    },
  );
  if (drift.spins) {
    // Whole turns, so a repeat never snaps back; and a flip of the face, back and forth.
    gsap.to(item, {
      rotation: `+=${gsap.utils.random([-360, 360])}`,
      duration: seconds * gsap.utils.random(1, 2),
      ease: 'none',
      repeat: -1,
    });
    gsap.to(body, {
      rotationX: '+=180',
      duration: gsap.utils.random(3, 5),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }
}

/**
 * What drifts over the felt in each season (DESIGN.md §3.6): petals, fireflies, leaves or
 * snowflakes, behind the page and never in the way. Off when the player turns it off or the
 * system asks for less motion; half as many on a phone. GSAP is loaded only when they show
 * (lib/gsap.ts).
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
    void loadGsap().then((gsap) => {
      if (stopped) return;
      const items = root.querySelectorAll<HTMLElement>('[data-drift]');
      const context = gsap.context((self) => {
        items.forEach((item) => {
          if (drift.falls) fall(gsap, self, item, drift, true);
          else float(gsap, item, drift);
        });
      }, root);
      undo = () => {
        context.revert();
        gsap.killTweensOf(root.querySelectorAll('*'));
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
