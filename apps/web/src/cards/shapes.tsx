import type { Suit } from '@tarot/engine';
import styles from './cards.module.css';

/** Colour class of a suit: red for ♥ ♦, black for ♠ ♣ (the pip shape carries the suit too). */
export const suitClass = (suit: Suit) => (suit === 'H' || suit === 'D' ? styles.red : styles.black);

/** An n-point star centred on (cx, cy), as polygon points. */
export function star(cx: number, cy: number, outer: number, inner: number, points: number) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}
