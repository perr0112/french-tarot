type Gsap = typeof import('gsap').gsap;

const all = (root: Element, anim: string) =>
  Array.from(root.querySelectorAll<SVGGraphicsElement>(`[data-anim='${anim}']`));

/** How far each layer drifts with the pointer, in the scene's units: the near moves most. */
const PARALLAX = { far: 8, mid: 16, near: 28 } as const;

/**
 * Brings a landscape (scenes.tsx) to life, in the calm of a cartoon: smoke curling up, windows
 * glowing, a snowman blinking, trees and flowers swaying, the river glinting, the sun turning,
 * butterflies, birds and ducks on their way; and the layers drifting a little with the pointer.
 * Everything is a GSAP tween inside the caller's context, so its revert ends them all.
 * Returns what to undo outside GSAP (the pointer listener).
 */
export function animateScene(
  gsap: Gsap,
  svg: SVGSVGElement,
  { light }: { light: boolean },
): () => void {
  const r = gsap.utils.random;

  // Winter: smoke from the chimney, puff after puff.
  all(svg, 'smoke').forEach((puff, i) => {
    gsap
      .timeline({ repeat: -1, delay: i * 0.8 })
      .set(puff, { y: 0, x: 0, scale: 0.6, opacity: 0, transformOrigin: '50% 50%' })
      .to(puff, { opacity: 0.85, duration: 0.6, ease: 'sine.out' })
      .to(puff, { y: -150, x: 40, scale: 1.8, opacity: 0, duration: 3.4, ease: 'sine.out' });
  });
  all(svg, 'glow').forEach((window) =>
    gsap.to(window, {
      opacity: 0.78,
      duration: r(0.8, 1.6),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    }),
  );
  all(svg, 'blink').forEach((eyes) =>
    gsap
      .timeline({ repeat: -1, repeatDelay: r(2.5, 5) })
      .to(eyes, { scaleY: 0.1, duration: 0.08, transformOrigin: '50% 50%' })
      .to(eyes, { scaleY: 1, duration: 0.12 }),
  );

  // Every season: canopies and flowers in the wind, each at its own pace (not on a phone,
  // where every moving outline costs a repaint of the whole scene).
  if (!light)
    all(svg, 'sway').forEach((canopy) =>
      gsap.fromTo(
        canopy,
        { rotation: -2, transformOrigin: '50% 100%' },
        {
          rotation: 2,
          duration: r(2.5, 4),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: r(0, 2),
        },
      ),
    );
  if (!light)
    all(svg, 'nod').forEach((head) =>
      gsap.fromTo(
        head,
        { rotation: -8, transformOrigin: '50% 100%' },
        {
          rotation: 8,
          duration: r(1.6, 2.6),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: r(0, 1.5),
        },
      ),
    );

  // Autumn: glints running down the river.
  all(svg, 'flow').forEach((glint, i) =>
    gsap.fromTo(
      glint,
      { strokeDashoffset: 0 },
      { strokeDashoffset: -88, duration: 2.4 + i * 0.6, ease: 'none', repeat: -1 },
    ),
  );

  // Summer: the sun's rays turning, butterflies wandering and beating their wings.
  all(svg, 'spin').forEach((rays) =>
    gsap.to(rays, {
      rotation: 360,
      duration: 60,
      ease: 'none',
      repeat: -1,
      transformOrigin: '50% 50%',
    }),
  );
  all(svg, 'butterfly').forEach((butterfly) => {
    const x = Number(gsap.getProperty(butterfly, 'x'));
    const y = Number(gsap.getProperty(butterfly, 'y'));
    gsap.to(butterfly, {
      x: () => x + r(-140, 140),
      y: () => y + r(-90, 60),
      rotation: () => r(-25, 25),
      transformOrigin: '50% 50%',
      duration: r(2.2, 3.6),
      ease: 'sine.inOut',
      repeat: -1,
      repeatRefresh: true,
    });
  });
  // A wing beat long enough to read at 30 frames a second.
  if (!light)
    all(svg, 'wings').forEach((wings) =>
      gsap.to(wings, {
        scaleX: 0.25,
        duration: r(0.22, 0.3),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        transformOrigin: '50% 50%',
      }),
    );

  // Spring: the rainbow breathing, birds crossing the sky, ducks paddling.
  all(svg, 'rainbow').forEach((rainbow) =>
    gsap.to(rainbow, { opacity: 0.3, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
  );
  all(svg, 'bird').forEach((bird, i) => {
    const y = Number(gsap.getProperty(bird, 'y'));
    gsap.fromTo(
      bird,
      { x: -120 - i * 80, y },
      {
        x: 1800,
        y: () => y + r(-60, 40),
        duration: r(18, 26),
        ease: 'none',
        repeat: -1,
        delay: i * 2.5,
        repeatRefresh: true,
      },
    );
  });
  if (!light)
    all(svg, 'flap').forEach((wing) =>
      gsap.to(wing, {
        scaleY: -0.6,
        duration: 0.22,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        transformOrigin: '50% 50%',
      }),
    );
  all(svg, 'duck').forEach((duck) => {
    const x = Number(gsap.getProperty(duck, 'x'));
    // From where it was drawn, paddling there and back.
    gsap.to(duck, { x: x + 80, duration: r(7, 10), ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(duck, { y: '+=3', duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  });

  // The layers drift a little with the pointer: depth without any 3D.
  const layers = (['far', 'mid', 'near'] as const).map((depth) => {
    const layer = svg.querySelector(`[data-depth='${depth}']`);
    return layer
      ? {
          depth,
          x: gsap.quickTo(layer, 'x', { duration: 1.2, ease: 'power3.out' }),
          y: gsap.quickTo(layer, 'y', { duration: 1.2, ease: 'power3.out' }),
        }
      : null;
  });
  const move = (event: PointerEvent) => {
    const dx = event.clientX / window.innerWidth - 0.5;
    const dy = event.clientY / window.innerHeight - 0.5;
    for (const layer of layers) {
      if (!layer) continue;
      layer.x(-dx * PARALLAX[layer.depth]);
      layer.y(-dy * PARALLAX[layer.depth] * 0.4);
    }
  };
  window.addEventListener('pointermove', move, { passive: true });
  return () => window.removeEventListener('pointermove', move);
}
