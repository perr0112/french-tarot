/**
 * Pause after a completed trick, so everyone sees it before the next card. The room waits this
 * long before the next move; the table keeps the last trick of a deal shown as long before the
 * deal result (DESIGN.md §3.6).
 */
export const TRICK_PAUSE_MS = 1500;

/**
 * Pause once the chien is turned over (petite, garde), so everyone sees it before the taker's
 * écart: the room waits this long before a bot taker discards (DESIGN.md §3.6).
 */
export const CHIEN_PAUSE_MS = 4000;
