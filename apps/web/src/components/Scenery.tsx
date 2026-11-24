import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { breakpoints } from '../design/tokens';
import { useMedia } from '../lib/media';
import { useAnimations, useSeason } from '../lib/theme';
import { loadGsap } from '../lib/gsap';
import { animateScene } from '../themes/scenery/animateScene';
import { Landscape } from '../themes/scenery/scenes';
import { createSkyPainter, type SkyPainter } from '../themes/scenery/sky';
import { SEASON_THEMES } from '../themes/seasons';
import styles from './Scenery.module.css';

/** Frames per second for the sky (fewer on a phone): calm, and light on a battery. */
const FPS = 30;
const FPS_COMPACT = 20;

/**
 * The season's cartoon landscape behind every screen (DESIGN.md §3.1): a sky drawn by a shader
 * (sky.ts; a plain gradient where WebGL2 is missing) and a hand-drawn scene (scenes.tsx),
 * brought to life by GSAP (animateScene.ts). The game lies on its felt board in front. Still,
 * with neither shader time nor tweens, when the player turns the animations off or the system
 * asks for less motion; a coarser, slower sky and fewer moving things on a phone.
 */
export function Scenery() {
  const season = useSeason();
  const on = useAnimations();
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const compact = useMedia(`(max-width: ${breakpoints.compact}px)`);
  const animated = on && !reduced;
  const canvas = useRef<HTMLCanvasElement>(null);
  const land = useRef<HTMLDivElement>(null);
  const painter = useRef<SkyPainter | null>(null);
  const [shader, setShader] = useState(true);
  const { sky } = SEASON_THEMES[season];

  // The sky: one painter for the page's life (or until its GPU context is lost).
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const created = createSkyPainter(element);
    painter.current = created;
    if (!created) {
      const timer = setTimeout(() => setShader(false), 0);
      return () => clearTimeout(timer);
    }
    // A lost GPU context (a driver reset, a sleeping laptop): the plain sky takes over.
    const lost = (event: Event) => {
      event.preventDefault();
      painter.current = null;
      setShader(false);
    };
    element.addEventListener('webglcontextlost', lost);
    return () => {
      element.removeEventListener('webglcontextlost', lost);
      created.destroy();
      painter.current = null;
    };
  }, []);

  // Its size, season and clock: drawn once when still, at FPS when animated.
  useEffect(() => {
    const sky0 = painter.current;
    const element = canvas.current;
    if (!sky0 || !element) return;
    // The sky is soft: drawn at part of the screen's resolution and stretched.
    const scale = compact ? 0.35 : 0.6;
    const interval = 1000 / (compact ? FPS_COMPACT : FPS);
    const size = () => sky0.resize(Math.ceil(innerWidth * scale), Math.ceil(innerHeight * scale));
    size();
    sky0.setSeason(season, sky);
    const start = performance.now();
    let frame = 0;
    let last = 0;
    let seconds = 0;
    // A steady cadence: frames are skipped by the clock, not by the screen's refresh rate.
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < interval - 1) return;
      last = now - ((now - last) % interval);
      seconds = (now - start) / 1000;
      sky0.draw(seconds);
    };
    const resized = () => {
      size();
      sky0.draw(seconds);
    };
    window.addEventListener('resize', resized);
    // A first frame at once: never a black sky waiting for the clock.
    sky0.draw(seconds);
    if (animated) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resized);
    };
  }, [season, sky, animated, compact]);

  // The landscape's life: GSAP, loaded only when it moves.
  useEffect(() => {
    const svg = land.current?.querySelector('svg');
    if (!animated || !svg) return;
    let stopped = false;
    let undo: (() => void) | null = null;
    void loadGsap().then((gsap) => {
      if (stopped) return;
      let unlisten = () => {};
      const context = gsap.context(() => {
        unlisten = animateScene(gsap, svg, { light: compact });
      }, svg);
      undo = () => {
        unlisten();
        context.revert();
      };
    });
    return () => {
      stopped = true;
      undo?.();
    };
  }, [animated, season, compact]);

  return createPortal(
    <div
      className={styles.scenery}
      aria-hidden="true"
      style={{ '--sky-top': sky.top, '--sky-horizon': sky.horizon } as CSSProperties}
    >
      <div className={styles.fallback} data-sky={shader ? 'shader' : 'fallback'} />
      <canvas ref={canvas} className={`${styles.sky} ${shader ? '' : styles.hidden}`} />
      <div ref={land} key={season} className={styles.land}>
        <Landscape season={season} compact={compact} />
      </div>
    </div>,
    document.body,
  );
}
