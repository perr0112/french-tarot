type Gsap = typeof import('gsap').gsap;

let loading: Promise<Gsap> | null = null;

/**
 * GSAP, loaded once and only when something decorative moves (the scenery, what drifts over
 * it): its ticker at 30 frames a second, calm and light on a battery. It is never used for the
 * game's own motion, which runs on the Web Animations API (DESIGN.md §3.6). A hidden page needs
 * no pausing: the browser stops its frames, and GSAP's lag smoothing avoids a jump on return.
 */
export function loadGsap(): Promise<Gsap> {
  loading ??= import('gsap').then(({ gsap }) => {
    gsap.ticker.fps(30);
    return gsap;
  });
  return loading;
}
