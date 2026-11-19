/**
 * Drawing units of the 100×177 card viewBox: the proportions of the Grimaud 1898 scans (median
 * width / height 0.564, see public/cards/SOURCES.md). Every size drawn over a card is named here.
 */
export const CARD_W = 100;
export const CARD_H = 177;
export const CENTER_X = CARD_W / 2;
export const CENTER_Y = CARD_H / 2;
/** Rotating by this keeps a drawing point-symmetric (the trumps' bottom band). */
export const HALF_TURN = `rotate(180 ${CENTER_X} ${CENTER_Y})`;
/**
 * Card outline: radius 8 units (8% of the width, 4.5% of the height, as the CSS clip), drawn
 * with a 1-unit stroke kept inside the card so the fill reaches the edge (no halo under the
 * shadow).
 */
export const CARD_RADIUS = 8;
export const EDGE_STROKE = 1;
export const EDGE_INSET = EDGE_STROKE / 2;

/**
 * Scans: drawn slightly larger than the card, centred, so the paper margin and the rounded
 * corners of the scan fall outside the clipped outline.
 */
export const SCAN_BLEED = 2.5;

/** Suit card corner index: rank above suit pip, at the left of its cartouche (INDEX_PLATE). */
export const INDEX_X = 13;
export const INDEX_BASELINE = 21;
export const INDEX_FONT = 18;
export const INDEX_MARK_Y = 31;
export const INDEX_MARK_SIZE = 13;
/**
 * The cartouche behind a suit card's corner index, in the paper colour: the scans have no index,
 * so it covers the scan's own top-left pip (all of it, never half) and carries ours instead.
 */
export const INDEX_PLATE = { x: 2, y: 3, width: 34, height: 37, radius: 3 } as const;

/**
 * Trumps: the scan's number bands (y 0–29…34 at the top, 143…146–177 at the bottom, measured on
 * the 21 scans) are covered by paper bands carrying our index at the left of the top band and,
 * turned, at the right of the bottom one: in the fan only our number shows, never a cut or
 * upside-down one. A thin ink rule closes each band.
 */
export const TRUMP_BAND = { height: 30, rule: 0.8 } as const;

/**
 * Label presets (corner index, mini card value). Two-character labels ("10"–"21") use a
 * smaller size with tighter tracking rather than squashed glyphs, so they keep their shapes.
 */
export const LABEL = {
  corner: { x: INDEX_X, y: INDEX_BASELINE, font: INDEX_FONT, fontWide: 16, trackingWide: -0.8 },
  /** A trump's number in its band, on the oudler badge's centre: larger, as it stands alone. */
  trump: { x: 12, y: 23, font: 20, fontWide: 18, trackingWide: -0.9 },
  mini: { x: CENTER_X, y: 78, font: 64, fontWide: 58, trackingWide: -3 },
} as const;
export type LabelPreset = keyof typeof LABEL;

/**
 * Oudler mark: the index stands on a solid badge with a light number (or star, on the Excuse),
 * which shows in the fan and in mini cards. On the Excuse the badge is the whole cartouche.
 */
export const OUDLER_BADGE = { x: 2.5, y: 4.5, width: 19, height: 23, radius: 3 } as const;

/** Stars of the Excuse (corner index and mini card); both have 8 points. */
export const EXCUSE_STAR_POINTS = 8;
export const EXCUSE_INDEX_STAR = { outer: 8, inner: 3.2 } as const;

/**
 * Mini mode (32–40 px, info bar strips): one large rank or number and a single mark, no
 * drawing, so suit and value read at a glance.
 */
export const MINI_PIP = { cy: 122, size: 50 } as const;
export const MINI_TRUMP_FRAME = { inset: 10, radius: 6, stroke: 5 } as const;
export const MINI_TRUMP_NUMBER_BASELINE = 110;
export const MINI_EXCUSE_STAR = { outer: 31, inner: 12 } as const;
