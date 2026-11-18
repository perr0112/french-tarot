import type { Suit } from '@tarot/engine';
import { HALF_TURN } from './geometry';

/**
 * The four suit shapes, drawn once in a 20×20 box (no font glyphs, which may render as emoji).
 * Each silhouette differs (inverted lobes + stem, lobes + point, rhombus, trefoil + stem),
 * so suits read without colour.
 */
const PIP_BOX = 20;
const PIP_PATHS: Record<Suit, string> = {
  S: 'M10 1.2 18.4 10.6A4.6 4.6 0 1 1 10 15.4 4.6 4.6 0 1 1 1.6 10.6ZM10 12 13 19H7Z',
  H: 'M10 18.6 1.6 9.4A4.6 4.6 0 1 1 10 4.6 4.6 4.6 0 1 1 18.4 9.4Z',
  D: 'M10 .6 17.4 10 10 19.4 2.6 10Z',
  C: 'M5.6 5.4a4.4 4.4 0 1 0 8.8 0 4.4 4.4 0 1 0-8.8 0ZM.6 11.4a4.4 4.4 0 1 0 8.8 0 4.4 4.4 0 1 0-8.8 0Zm10 0a4.4 4.4 0 1 0 8.8 0 4.4 4.4 0 1 0-8.8 0ZM9 9.5 7 19H13L11 9.5Z',
};

/** A suit pip centred on (cx, cy), `size` units wide; `flip` turns it upside down. */
export function Pip({
  suit,
  cx,
  cy,
  size,
  flip = false,
  className,
}: {
  suit: Suit;
  cx: number;
  cy: number;
  size: number;
  flip?: boolean;
  className?: string | undefined;
}) {
  const s = size / PIP_BOX;
  const place = `translate(${cx - size / 2} ${cy - size / 2}) scale(${s})`;
  const transform = flip ? `rotate(180 ${cx} ${cy}) ${place}` : place;
  return <path d={PIP_PATHS[suit]} transform={transform} className={className} />;
}

/** Draws `children` twice: as is, then turned half a turn (corner indices). */
export function BothCorners({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <g transform={HALF_TURN}>{children}</g>
    </>
  );
}
