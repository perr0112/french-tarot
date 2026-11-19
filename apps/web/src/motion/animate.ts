import type { Card, Seat } from '@tarot/engine';
import { tokens } from '../design/tokens';
import { flipFrom, type Box } from './flip';

/**
 * Table motion (DESIGN.md §3.6), with the Web Animations API: transform and opacity only, never
 * awaited by the game — the view is already up to date, the animation only catches up. Each
 * helper does nothing where the API is missing (tests) and only fades, briefly, under
 * prefers-reduced-motion.
 */

const ms = (token: string) => Number.parseInt(token, 10);
export const DURATION = {
  instant: ms(tokens.duration.instant),
  fast: ms(tokens.duration.fast),
  base: ms(tokens.duration.base),
  slow: ms(tokens.duration.slow),
  deal: ms(tokens.motion.deal),
} as const;
export const EASE = tokens.ease;
/** Cards leaving a seat's badge (played, dealt) start small there and grow to their place. */
export const FROM_SEAT_SCALE = Number(tokens.motion['from-seat']);
/** Collected cards end at this size, on the winner's seat. */
const COLLECTED_SCALE = Number(tokens.motion.collected);
/** Share of a dealt card's flight during which it fades in, so none piles up on the dealer. */
const DEALT_FADE_UNTIL = 0.2;
/** Share of a collected card's flight by which it has faded out, clearing the centre at once. */
const COLLECTED_GONE_AT = 0.5;

/** Delay between two dealt cards, so a whole deal takes `motion-deal` however many cards. */
export const dealStagger = (cards: number) =>
  cards > 1 ? Math.max(0, DURATION.deal - DURATION.base) / (cards - 1) : 0;

export const canAnimate = (element: Element): element is HTMLElement =>
  typeof (element as HTMLElement).animate === 'function';

export const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Where the layout puts an element, ignoring any transform (a running animation, a hover lift),
 * which getBoundingClientRect would include. offsetLeft/Top start inside the parent's border.
 */
export function layoutBox(element: HTMLElement): Box {
  const parent = element.offsetParent;
  const origin = parent?.getBoundingClientRect() ?? { x: 0, y: 0 };
  return {
    x: origin.x + (parent?.clientLeft ?? 0) + element.offsetLeft,
    y: origin.y + (parent?.clientTop ?? 0) + element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

/** A seat's badge on screen (SeatBadge carries data-seat), where its cards come from and go. */
export function seatBox(seat: Seat): Box | null {
  return document.querySelector(`[data-seat="${seat}"]`)?.getBoundingClientRect() ?? null;
}

/**
 * Where each card of the local hand stands, so a played card leaves from its place: written by
 * the hand on layout and again on click (the face is lifted then), read when the card arrives.
 */
const handBoxes = new Map<Card, Box>();
export const rememberHandBox = (card: Card, box: Box) => void handBoxes.set(card, box);
export const handBox = (card: Card) => handBoxes.get(card) ?? null;

const fadeIn = (element: HTMLElement, delay = 0) =>
  element.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: DURATION.instant,
    delay,
    easing: EASE.out,
    fill: 'backwards',
  });

/**
 * Brings an element from `from` to its place (a card played, a card dealt), starting at `scale`
 * (default: the size of `from`). `fade`: it also fades in over the start of its flight.
 */
export function flyIn(
  element: Element,
  from: Box | null,
  {
    delay = 0,
    scale: startScale,
    fade = false,
  }: { delay?: number; scale?: number; fade?: boolean } = {},
): Animation | null {
  if (!canAnimate(element)) return null;
  if (reducedMotion() || !from) return fadeIn(element, delay);
  const flip = flipFrom(from, element.getBoundingClientRect());
  const start = `translate(${flip.x}px, ${flip.y}px) scale(${startScale ?? flip.scale})`;
  const keyframes: Keyframe[] = fade
    ? [
        { transform: start, opacity: 0 },
        { opacity: 1, offset: DEALT_FADE_UNTIL },
        { transform: 'none', opacity: 1 },
      ]
    : [{ transform: start }, { transform: 'none' }];
  return element.animate(keyframes, {
    duration: DURATION.base,
    delay,
    easing: EASE.out,
    fill: 'backwards',
  });
}

/**
 * Takes an element from its place to `to`, shrinking (a trick collected). It leaves at once and
 * has faded by mid-flight, so the next trick's cards are never mixed with it.
 */
export function flyOut(element: Element, to: Box | null): Animation | null {
  if (!canAnimate(element)) return null;
  if (reducedMotion() || !to) {
    return element.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DURATION.instant,
      fill: 'forwards',
    });
  }
  const { x, y } = flipFrom(to, element.getBoundingClientRect());
  return element.animate(
    [
      { transform: 'none', opacity: 1 },
      { opacity: 0, offset: COLLECTED_GONE_AT },
      { transform: `translate(${x}px, ${y}px) scale(${COLLECTED_SCALE})`, opacity: 0 },
    ],
    { duration: DURATION.slow, easing: EASE.out, fill: 'forwards' },
  );
}

/** Slides an element from its previous box to its new one (the hand closing a gap). */
export function slideFrom(element: Element, previous: Box): Animation | null {
  if (!canAnimate(element) || reducedMotion()) return null;
  const now = layoutBox(element);
  const dx = previous.x - now.x;
  const dy = previous.y - now.y;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;
  return element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
    duration: DURATION.fast,
    easing: EASE.out,
  });
}

/** Fades in a card that joins the hand (the chien, for the taker); none under reduced motion. */
export function appear(element: Element): Animation | null {
  if (!canAnimate(element) || reducedMotion()) return null;
  return element.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: DURATION.fast,
    easing: EASE.out,
    fill: 'backwards',
  });
}
