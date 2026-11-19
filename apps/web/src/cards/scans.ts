import { ALL_CARDS, type Card } from '@tarot/engine';

/**
 * Card art: scans of the Tarot nouveau B.P. Grimaud (1898), public domain, digitised by the
 * BnF (public/cards/SOURCES.md). Served from public/cards, written by scripts/fetch-cards.py.
 */
const scan = (name: string) => `${import.meta.env.BASE_URL}cards/${name}.webp`;

export const faceScan = (card: Card) => scan(card);
export const backScan = scan('back');

const loaded = new Set<string>();
const loading = new Map<string, Promise<void>>();

/** Whether a scan is already decoded, so a card can show it at once, without fading in. */
export const isScanLoaded = (src: string) => loaded.has(src);

/**
 * Resolves once a scan is loaded and decoded (never rejects: a missing scan leaves the paper
 * face with its index). Each scan is fetched once, whoever asks first.
 */
export function scanLoaded(src: string): Promise<void> {
  let promise = loading.get(src);
  if (!promise) {
    const image = new Image();
    image.src = src;
    const ready =
      typeof image.decode === 'function'
        ? image.decode()
        : new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = reject;
          });
    promise = ready.then(
      () => void loaded.add(src),
      () => undefined,
    );
    loading.set(src, promise);
  }
  return promise;
}

/** Fetches every scan once, so cards show at once when dealt (about 2 MB). Called on app start. */
export function preloadScans() {
  if (typeof Image === 'undefined') return;
  for (const src of [...ALL_CARDS.map(faceScan), backScan]) void scanLoaded(src);
}
