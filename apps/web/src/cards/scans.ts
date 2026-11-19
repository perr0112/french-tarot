import { ALL_CARDS, type Card } from '@tarot/engine';

/**
 * Card art: scans of the Tarot nouveau B.P. Grimaud (1898), public domain, digitised by the
 * BnF (public/cards/SOURCES.md). Served from public/cards, written by scripts/fetch-cards.py.
 */
const scan = (name: string) => `${import.meta.env.BASE_URL}cards/${name}.webp`;

export const faceScan = (card: Card) => scan(card);
export const backScan = scan('back');

let preloaded = false;

/** Fetches every scan once, so cards show at once when dealt (about 2 MB in all). */
export function preloadScans() {
  if (preloaded || typeof Image === 'undefined') return;
  preloaded = true;
  for (const src of [...ALL_CARDS.map(faceScan), backScan]) {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
  }
}
