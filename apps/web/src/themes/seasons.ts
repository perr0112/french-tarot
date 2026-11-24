/**
 * The four seasonal themes, each in one place (DESIGN.md §3.1): the felt's shade (always green),
 * its light, the mat, the flourishes' metal, the motif at the mat's corners, and what drifts
 * over the felt. Everything else (the accent, the cards, the panels) stays the same.
 */
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

/** What drifts over the felt (SeasonalAmbience). */
export interface Drift {
  readonly shape: 'petal' | 'firefly' | 'leaf' | 'flake';
  /** Fill colours, picked in turn. */
  readonly colors: readonly string[];
  /** How many on a desktop screen (half on a phone). */
  readonly count: number;
  /** Falling from the top (petals, leaves, flakes), or floating where they are (fireflies). */
  readonly falls: boolean;
  /** Seconds to cross the screen (or one float), drawn between the two. */
  readonly seconds: readonly [number, number];
  /** Pixels, drawn between the two. */
  readonly size: readonly [number, number];
  /** Turns while falling. */
  readonly spins: boolean;
}

/** The sky behind the scenery (themes/scenery/sky.ts), from its top to the horizon. */
export interface Sky {
  readonly top: string;
  readonly horizon: string;
}

export interface SeasonTheme {
  /** CSS colour tokens the season overrides (`--color-…`). */
  readonly colors: Readonly<Record<string, string>>;
  /** Spring's soft morning, summer's noon, autumn's sunset, winter's dusk. */
  readonly sky: Sky;
  /** The colour shown for it in the theme menu. */
  readonly swatch: string;
  readonly drift: Drift;
}

export const SEASON_THEMES: Readonly<Record<Season, SeasonTheme>> = {
  spring: {
    sky: { top: '#8EC5EA', horizon: '#F8DDE6' },
    colors: {
      table: '#264D37',
      'table-edge': '#1A3627',
      'table-light': 'rgb(255 250 225 / 0.08)',
      mat: '#684A30',
      'mat-edge': '#553C26',
      ornament: '#DDBE84',
    },
    swatch: '#E8B4C4',
    drift: {
      shape: 'petal',
      colors: ['#F2B8C8', '#F6C9D6', '#EFA9BE'],
      count: 18,
      falls: true,
      seconds: [12, 20],
      size: [10, 15],
      spins: true,
    },
  },
  summer: {
    sky: { top: '#3F9FE6', horizon: '#CDEBFF' },
    colors: {
      table: '#1F4A35',
      'table-edge': '#153527',
      'table-light': 'rgb(255 224 150 / 0.1)',
      mat: '#7A3E2B',
      'mat-edge': '#63301F',
      ornament: '#D9B26A',
    },
    swatch: '#E9C46A',
    drift: {
      shape: 'firefly',
      colors: ['#FFE9A8', '#FFF4CC'],
      count: 14,
      falls: false,
      seconds: [5, 9],
      size: [10, 16],
      spins: false,
    },
  },
  autumn: {
    sky: { top: '#4E3F7E', horizon: '#F4A261' },
    colors: {
      table: '#34472A',
      'table-edge': '#243219',
      'table-light': 'rgb(255 205 150 / 0.08)',
      mat: '#553624',
      'mat-edge': '#432A1C',
      ornament: '#C9A46A',
      // A darker rim, apart from the mat's brown.
      rim: '#4A2E1F',
    },
    swatch: '#C8743A',
    drift: {
      shape: 'leaf',
      colors: ['#C8743A', '#B5532F', '#D9A441', '#8E4A2B'],
      count: 12,
      falls: true,
      seconds: [11, 18],
      size: [16, 22],
      spins: true,
    },
  },
  winter: {
    sky: { top: '#121A3C', horizon: '#5A4A8C' },
    colors: {
      table: '#1C3833',
      'table-edge': '#12261F',
      'table-light': 'rgb(215 232 255 / 0.08)',
      mat: '#3F4A55',
      'mat-edge': '#313A43',
      ornament: '#C7D0D8',
    },
    swatch: '#BFD6E6',
    drift: {
      shape: 'flake',
      colors: ['#FFFFFF', '#E6F0F8'],
      count: 24,
      falls: true,
      seconds: [16, 26],
      size: [7, 12],
      spins: true,
    },
  },
};
