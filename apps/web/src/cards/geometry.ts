/**
 * Drawing units of the 100×177 card viewBox: the proportions of the Grimaud 1898 scans (median
 * width / height 0.564, see public/cards/SOURCES.md). Every size drawn over a card is named here.
 */
export const CARD_W = 100;
export const CARD_H = 177;
export const CENTER_X = CARD_W / 2;
export const CENTER_Y = CARD_H / 2;
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

/** Corner index: rank (or trump number) above a small mark (suit pip, trump frame, star). */
export const INDEX_X = 11;
export const INDEX_BASELINE = 21;
export const INDEX_FONT = 18;
export const INDEX_MARK_Y = 31;
export const INDEX_MARK_SIZE = 12;
/**
 * The cartouche behind the corner index: the scans have no index (pip cards) or a centred one
 * (trumps), so the index sits on its own light block, legible over any part of the drawing.
 */
export const INDEX_PLATE = { x: 2.5, y: 5, width: 17, height: 33, radius: 3 } as const;

/**
 * Label presets (corner index, mini card value). Two-character labels ("10"–"21") use a
 * smaller size with tighter tracking rather than squashed glyphs, so they keep their shapes.
 */
export const LABEL = {
  corner: { x: INDEX_X, y: INDEX_BASELINE, font: INDEX_FONT, fontWide: 16, trackingWide: -0.8 },
  mini: { x: CENTER_X, y: 78, font: 64, fontWide: 58, trackingWide: -3 },
} as const;
export type LabelPreset = keyof typeof LABEL;

/** Trump corner mark: a solid miniature frame, so it stays crisp at fan size. */
export const TRUMP_INDEX_MARK = { width: 9, height: 12, radius: 1.5 } as const;

/**
 * Oudler mark: the corner index turns into a solid badge with a light number (or star, on the
 * Excuse), which shows in the fan and in mini cards.
 */
export const OUDLER_BADGE = { x: 2.5, y: 5, width: 17, height: 21, radius: 3 } as const;

/** Stars of the Excuse (corner index and mini card); both have 8 points. */
export const EXCUSE_STAR_POINTS = 8;
export const EXCUSE_INDEX_STAR = { cy: 15.5, outer: 8, inner: 3.2 } as const;

/**
 * Mini mode (32–40 px, info bar strips): one large rank or number and a single mark, no
 * drawing, so suit and value read at a glance.
 */
export const MINI_PIP = { cy: 122, size: 50 } as const;
export const MINI_TRUMP_FRAME = { inset: 10, radius: 6, stroke: 5 } as const;
export const MINI_TRUMP_NUMBER_BASELINE = 110;
export const MINI_EXCUSE_STAR = { outer: 31, inner: 12 } as const;
