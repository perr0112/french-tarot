/** A box on screen, as DOMRect gives it. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A transform taking an element from its own box to another one (centre and width). */
export interface Flip {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

const centre = (box: Box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/**
 * FLIP's "invert" step: the transform that puts an element laid out at `to` where `from` is, so
 * animating it back to no transform moves it from `from` to its place.
 */
export function flipFrom(from: Box, to: Box): Flip {
  const a = centre(from);
  const b = centre(to);
  return { x: a.x - b.x, y: a.y - b.y, scale: to.width > 0 ? from.width / to.width : 1 };
}
