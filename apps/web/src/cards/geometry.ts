/**
 * Drawing units of the 100×160 card viewBox (5:8). Every size inside a card is named here,
 * so the whole set stays consistent and can be tuned in one place.
 */
export const CARD_W = 100;
export const CARD_H = 160;
export const CENTER_X = CARD_W / 2;
export const CENTER_Y = CARD_H / 2;
/**
 * Card outline: radius 8 units (8% of the width, 5% of the height, as the CSS clip), drawn with
 * a 1-unit stroke kept inside the card so the fill reaches the edge (no halo under the shadow).
 */
export const CARD_RADIUS = 8;
export const EDGE_STROKE = 1;
export const EDGE_INSET = EDGE_STROKE / 2;
/** Rotating by this keeps a drawing point-symmetric (bottom-right corner index). */
export const HALF_TURN = `rotate(180 ${CENTER_X} ${CENTER_Y})`;

/** Corner index: rank (or trump number) above a small mark (suit pip, trump frame, star). */
export const INDEX_X = 11;
export const INDEX_BASELINE = 21;
export const INDEX_FONT = 18;
export const INDEX_MARK_Y = 31;
export const INDEX_MARK_SIZE = 12;

/**
 * Label presets (corner index, mini card value). Two-character labels ("10"–"21") use a
 * smaller size with tighter tracking rather than squashed glyphs, so they keep their shapes.
 */
export const LABEL = {
  corner: { x: INDEX_X, y: INDEX_BASELINE, font: INDEX_FONT, fontWide: 16, trackingWide: -0.8 },
  mini: { x: CENTER_X, y: 70, font: 64, fontWide: 58, trackingWide: -3 },
} as const;
export type LabelPreset = keyof typeof LABEL;

/** Pip cards. */
export const PIP_SIZE = 19;
/** Nine and ten: three columns set wider apart and smaller pips, so no two pips touch. */
export const PIP_SIZE_DENSE = 16;
export const PIP_COLUMNS_DENSE = { left: 30, centre: 50, right: 70 } as const;
export const ACE_SIZE = 40;
export const PIP_COLUMNS = { left: 33, centre: 50, right: 67 } as const;
export const PIP_TOP = 32;
export const PIP_BOTTOM = 128;

/** Trumps: a shared frame between the two corner margins, in a light stroke. */
export const TRUMP_FRAME = { x: 22, y: 8, width: 56, height: 144, radius: 3 } as const;
export const TRUMP_FRAME_STROKE = 1;
export const TRUMP_NUMBER_FONT = 40;
export const TRUMP_NUMBER_BASELINE = 94;
export const TRUMP_RULE = { x1: 40, x2: 60, top: 56, bottom: 106 } as const;
/** Trump corner mark: a solid miniature of the frame, so it stays crisp at fan size. */
export const TRUMP_INDEX_MARK = { width: 9, height: 12, radius: 1.5 } as const;

/**
 * Oudler mark, in two parts: the corner index turns into a solid badge with a light number (or
 * star, on the Excuse), which shows in the fan and in mini cards; and solid discs sit on the
 * top and bottom centre of the frame line.
 */
export const OUDLER_DISC = 5.5;
export const OUDLER_BADGE = { x: 2.5, y: 5, width: 17, height: 21, radius: 3 } as const;

/** Excuse. */
export const EXCUSE_DISC = { cy: 80, r: 27 } as const;
export const EXCUSE_STAR = { outer: 19.5, inner: 7.5, points: 8 } as const;
export const EXCUSE_INDEX_STAR = { cy: 15.5, outer: 8, inner: 3.2 } as const;

/**
 * Court figures: a shared head on the centre line; per rank (11 Valet … 14 Roi) the head height
 * and the cut-out pip (centre height, size). Silhouette path data stays in CourtFigure.tsx.
 */
export const COURT_HEAD_R = 8;
export const COURT_HEAD_Y: Record<number, number> = { 11: 53, 12: 51, 13: 58, 14: 61 };
export const COURT_PIP: Record<number, { readonly cy: number; readonly size: number }> = {
  11: { cy: 102, size: 15 },
  12: { cy: 104, size: 13 },
  13: { cy: 112, size: 17 },
  14: { cy: 104, size: 22 },
};
export const COURT_BEAD_R = 2.6;

/** Back. */
export const BACK_INSET = 7;
export const BACK_INNER_RADIUS = 4;
export const BACK_RINGS = [28, 18] as const;
export const BACK_CORE = 8;

/** Line width of the back's inset line and rings. */
export const LINE = 1.5;

/**
 * Mini mode (32–40 px, info bar strips): one large rank or number and a single mark, no corner
 * indices, so suit and value read at a glance.
 */
export const MINI_PIP = { cy: 114, size: 50 } as const;
export const MINI_TRUMP_FRAME = { inset: 10, radius: 6, stroke: 5 } as const;
export const MINI_TRUMP_NUMBER_BASELINE = 102;
export const MINI_EXCUSE_STAR = { outer: 31, inner: 12 } as const;
