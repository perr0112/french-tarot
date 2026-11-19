import type { Card, Seat } from '@tarot/engine';
import { tokens } from '../design/tokens';
import { flipFrom, type Box } from './flip';

/**
 * Table motion (DESIGN.md §3.6), with the Web Animations API: transform and opacity only, never
 * awaited by the game — the view is already up to date, the animation only catches up. Each
 * helper does nothing where the API is missing (tests) and fades instead of moving under
 * prefers-reduced-motion.
 */

const ms = (token: string) => Number.parseInt(token, 10);
export const DURATION = {
  instant: ms(tokens.duration.instant),
  fast: ms(tokens.duration.fast),
  base: ms(tokens.duration.base),
  slow: ms(tokens.duration.slow),
} as const;
export const EASE = tokens.ease;
/** Collected cards end at this size, on the winner's seat. */
const COLLECTED_SCALE = 0.4;
/** Cards leaving a seat's badge (played, dealt) start small there and grow to their place. */
export const FROM_SEAT_SCALE = 0.5;
/** Delay between two cards dealt into the hand. */
export const DEAL_STAGGER_MS = 25;

export const canAnimate = (element: Element): element is HTMLElement =>
  typeof (element as HTMLElement).animate === 'function';

export const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Where the layout puts an element, ignoring any transform (a running animation, a hover lift):
 * getBoundingClientRect would include them.
 */
export function layoutBox(element: HTMLElement): Box {
  const parent = element.offsetParent?.getBoundingClientRect() ?? { x: 0, y: 0 };
  return {
    x: parent.x + element.offsetLeft,
    y: parent.y + element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

/** A seat's badge on screen (SeatBadge carries data-seat), where its cards come from and go. */
export function seatBox(seat: Seat): Box | null {
  return document.querySelector(`[data-seat="${seat}"]`)?.getBoundingClientRect() ?? null;
}

/** Where each card of the local hand last stood, so a played card leaves from its place. */
const handBoxes = new Map<Card, Box>();
export const rememberHandBox = (card: Card, box: Box) => void handBoxes.set(card, box);
export const handBox = (card: Card) => handBoxes.get(card) ?? null;

const fadeIn = (element: HTMLElement, duration: number, delay = 0) =>
  element.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration,
    delay,
    easing: EASE.out,
    fill: 'backwards',
  });

/**
 * Brings an element from `from` to its place (a card played, a card dealt), starting at `scale`
 * (default: the size of `from`).
 */
export function flyIn(
  element: Element,
  from: Box | null,
  {
    duration = DURATION.base,
    delay = 0,
    scale: startScale,
  }: { duration?: number; delay?: number; scale?: number } = {},
): Animation | null {
  if (!canAnimate(element)) return null;
  if (reducedMotion() || !from) return fadeIn(element, DURATION.instant, delay);
  const flip = flipFrom(from, element.getBoundingClientRect());
  const { x, y } = flip;
  const scale = startScale ?? flip.scale;
  return element.animate(
    [{ transform: `translate(${x}px, ${y}px) scale(${scale})` }, { transform: 'none' }],
    { duration, delay, easing: EASE.out, fill: 'backwards' },
  );
}

/** Takes an element from its place to `to`, shrinking and fading (a trick collected). */
export function flyOut(element: Element, to: Box | null): Animation | null {
  if (!canAnimate(element)) return null;
  const out = { opacity: 0 };
  if (reducedMotion() || !to) {
    return element.animate([{ opacity: 1 }, out], { duration: DURATION.instant, fill: 'forwards' });
  }
  const { x, y } = flipFrom(to, element.getBoundingClientRect());
  return element.animate(
    [
      { transform: 'none', opacity: 1 },
      { transform: `translate(${x}px, ${y}px) scale(${COLLECTED_SCALE})`, ...out },
    ],
    { duration: DURATION.slow, easing: EASE['in-out'], fill: 'forwards' },
  );
}

/** Slides an element from its previous box to its new one (the hand closing a gap). */
export function slideFrom(element: Element, previous: Box): Animation | null {
  if (!canAnimate(element) || reducedMotion()) return null;
  const now = layoutBox(element);
  const dx = previous.x - now.x;
  if (Math.abs(dx) < 0.5) return null;
  return element.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], {
    duration: DURATION.fast,
    easing: EASE.out,
  });
}

/** Fades in a card that joins the hand (the chien, for the taker). */
export function appear(element: Element): Animation | null {
  return canAnimate(element) ? fadeIn(element, DURATION.fast) : null;
}
