import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { breakpoints } from '../design/tokens';
import { useMedia } from '../lib/media';
import { useAnimations, useSeason } from '../lib/theme';
import { animateScene } from '../themes/scenery/animateScene';
import { Landscape } from '../themes/scenery/scenes';
import { createSkyPainter, type SkyPainter } from '../themes/scenery/sky';
import { SEASON_THEMES } from '../themes/seasons';
import styles from './Scenery.module.css';

/** Frames per second for the sky and the scene: calm, and light on a laptop's battery. */
const FPS = 30;

/**
 * The season's cartoon landscape behind every screen (DESIGN.md §3.1): a sky drawn by a shader
 * (sky.ts; a plain gradient where WebGL2 is missing) and a hand-drawn scene (scenes.tsx),
 * brought to life by GSAP (animateScene.ts). The game lies on its felt board in front. Still,
 * with neither shader time nor tweens, when the player turns the animations off or the system
 * asks for less motion; paused while the page is hidden; a coarser sky on a phone.
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

  // The sky: one painter for the page's life.
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const created = createSkyPainter(element);
    painter.current = created;
    if (!created) {
      const timer = setTimeout(() => setShader(false), 0);
      return () => clearTimeout(timer);
    }
    return () => {
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
    const size = () => sky0.resize(Math.ceil(innerWidth * scale), Math.ceil(innerHeight * scale));
    size();
    sky0.setSeason(season, sky);
    const start = performance.now();
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden || now - last < 1000 / FPS) return;
      last = now;
      sky0.draw((now - start) / 1000);
    };
    const resized = () => {
      size();
      if (!animated) sky0.draw(0);
    };
    window.addEventListener('resize', resized);
    if (animated) frame = requestAnimationFrame(tick);
    else sky0.draw(0);
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
    void import('gsap').then(({ gsap }) => {
      if (stopped) return;
      gsap.ticker.fps(FPS);
      let unlisten = () => {};
      const context = gsap.context(() => {
        unlisten = animateScene(gsap, svg);
      }, svg);
      const visibility = () => gsap.globalTimeline.paused(document.hidden);
      document.addEventListener('visibilitychange', visibility);
      undo = () => {
        document.removeEventListener('visibilitychange', visibility);
        unlisten();
        context.revert();
        gsap.globalTimeline.paused(false);
      };
    });
    return () => {
      stopped = true;
      undo?.();
    };
  }, [animated, season]);

  return createPortal(
    <div
      className={styles.scenery}
      aria-hidden="true"
      style={{ '--sky-top': sky.top, '--sky-horizon': sky.horizon } as CSSProperties}
    >
      <div className={styles.fallback} data-sky={shader ? 'shader' : 'fallback'} />
      <canvas ref={canvas} className={`${styles.sky} ${shader ? '' : styles.hidden}`} />
      <div ref={land} key={season} className={styles.land}>
        <Landscape season={season} />
      </div>
    </div>,
    document.body,
  );
}
