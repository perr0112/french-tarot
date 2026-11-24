import { CARD_H, CARD_RADIUS, CARD_W } from '../cards/geometry';

/** Design tokens (DESIGN.md §3). Components use them through the CSS custom properties below. */
export const tokens = {
  color: {
    /** The green felt of the table and its darker edges (autumn's; each season has its own,
     * `seasons` below). */
    table: '#34472A',
    'table-edge': '#243219',
    /** A soft light on the felt, and its fine weave (DESIGN.md §2, the table's exception). */
    'table-light': 'rgb(255 244 220 / 0.07)',
    'table-weave': 'rgb(0 0 0 / 0.05)',
    /** The brown mat where the cards are laid: felt, edge, weave, stitching (by season). */
    mat: '#553624',
    'mat-edge': '#432A1C',
    'mat-weave': 'rgb(0 0 0 / 0.04)',
    'mat-stitch': 'rgb(244 226 200 / 0.35)',
    /** The mat's corner flourishes: a muted metal, never the accent (by season). */
    ornament: '#C9A46A',
    /** Captions laid on the mat (the chien, the last trick). */
    'ink-on-mat-muted': '#E2D8CA',
    surface: '#FAFAF7',
    'surface-muted': '#F1F0EB',
    ink: '#1C1C1A',
    'ink-muted': '#6B6A65',
    'ink-on-table': '#F4F2EA',
    'ink-on-table-muted': '#C8C2B4',
    accent: '#E2B04A',
    'suit-red': '#C23B32',
    'suit-black': '#1C1C1A',
    'card-face': '#FFFDF8',
    /** The paper of the scanned cards: cartouches and bands drawn over them. */
    'card-paper': '#E4E1D5',
    'card-edge': 'rgb(0 0 0 / 0.12)',
    positive: '#2F7A49',
    negative: '#B5473D',
  },
  text: {
    xs: ['12px', '16px'],
    sm: ['14px', '20px'],
    md: ['16px', '24px'],
    lg: ['20px', '28px'],
    xl: ['28px', '34px'],
  },
  weight: { regular: '400', emphasis: '600' },
  space: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px', 8: '64px' },
  /** card: the drawn corner (geometry.ts) as a share of the card's width / height. */
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    card: `${(CARD_RADIUS / CARD_W) * 100}% / ${((CARD_RADIUS / CARD_H) * 100).toFixed(2)}%`,
  },
  shadow: {
    /** The mat lying on the table. */
    mat: '0 6px 18px rgb(0 0 0 / 0.45)',
    card: '0 1px 2px rgb(0 0 0 / 0.18), 0 2px 6px rgb(0 0 0 / 0.12)',
    raised: '0 4px 12px rgb(0 0 0 / 0.22)',
    panel: '0 8px 24px rgb(0 0 0 / 0.16)',
  },
  duration: { instant: '100ms', fast: '180ms', base: '260ms', slow: '400ms' },
  /**
   * Table motion (DESIGN.md §3.6): `deal` is the whole deal animation, whatever the number of
   * cards; cards leaving a badge start at `from-seat`; collected tricks end at `collected`;
   * the chien's cards turn over `turn-stagger` apart.
   */
  motion: { deal: '700ms', 'from-seat': '0.5', collected: '0.4', 'turn-stagger': '40ms' },
  ease: {
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
  border: { thin: '1px', thick: '2px', selected: '3px' },
  focus: { offset: '2px' },
  width: { narrow: '420px', regular: '560px', wide: '720px', mat: '880px' },
  card: {
    /** Height / width of every card (the scans' proportions, geometry.ts). */
    ratio: String(CARD_H / CARD_W),
    hand: 'clamp(56px, min(7vw, 9vh), 84px)',
    trick: 'clamp(48px, min(7vw, 8vh), 80px)',
    /** Share of a card hidden by the next one in a spread (the chien). */
    'spread-overlap': '0.45',
    /** The winner's card on the final podium. */
    podium: 'clamp(84px, 12vw, 128px)',
    /** The other players' cards on the final podium (by width alone, like the winner's). */
    'podium-rest': 'clamp(56px, 7vw, 84px)',
    mini: '32px',
    chip: '36px',
  },
  font: { ui: "'Inter Variable', system-ui, sans-serif" },
} as const;

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

/**
 * The seasons' themes (DESIGN.md §3.1): the felt stays green, its shade changes, and so do the
 * mat and the flourishes' metal. Everything else (the accent, the cards, the panels) stays.
 */
export const seasons: Readonly<Record<Season, Readonly<Record<string, string>>>> = {
  spring: {
    table: '#264D37',
    'table-edge': '#1A3627',
    mat: '#684A30',
    'mat-edge': '#553C26',
    ornament: '#DDBE84',
  },
  summer: {
    table: '#1F4A35',
    'table-edge': '#153527',
    mat: '#7A3E2B',
    'mat-edge': '#63301F',
    ornament: '#D9B26A',
  },
  autumn: {
    table: '#34472A',
    'table-edge': '#243219',
    mat: '#553624',
    'mat-edge': '#432A1C',
    ornament: '#C9A46A',
  },
  winter: {
    table: '#1C3833',
    'table-edge': '#12261F',
    mat: '#3F4A55',
    'mat-edge': '#313A43',
    ornament: '#C7D0D8',
  },
};

/**
 * Breakpoints (DESIGN.md §5). CSS variables cannot be used inside media queries,
 * so `compact` is the single breakpoint: write `@media (max-width: 600px)` in CSS
 * and import this constant in TS.
 */
export const breakpoints = { compact: 600 } as const;

/** The tokens as CSS custom properties on :root, e.g. `--color-accent`, `--text-md-size`. */
export function tokensCss(): string {
  const vars: string[] = [];
  const add = (name: string, value: string) => vars.push(`--${name}: ${value};`);
  for (const [k, v] of Object.entries(tokens.color)) add(`color-${k}`, v);
  for (const [k, [size, line]] of Object.entries(tokens.text)) {
    add(`text-${k}-size`, size);
    add(`text-${k}-line`, line);
  }
  for (const [k, v] of Object.entries(tokens.weight)) add(`weight-${k}`, v);
  for (const [k, v] of Object.entries(tokens.space)) add(`space-${k}`, v);
  for (const [k, v] of Object.entries(tokens.radius)) add(`radius-${k}`, v);
  for (const [k, v] of Object.entries(tokens.shadow)) add(`shadow-${k}`, v);
  for (const [k, v] of Object.entries(tokens.duration)) add(`duration-${k}`, v);
  for (const [k, v] of Object.entries(tokens.ease)) add(`ease-${k}`, v);
  for (const [k, v] of Object.entries(tokens.motion)) add(`motion-${k}`, v);
  for (const [k, v] of Object.entries(tokens.border)) add(`border-${k}`, v);
  for (const [k, v] of Object.entries(tokens.focus)) add(`focus-${k}`, v);
  for (const [k, v] of Object.entries(tokens.width)) add(`width-${k}`, v);
  for (const [k, v] of Object.entries(tokens.card)) add(`card-${k}`, v);
  add('font-ui', tokens.font.ui);
  const themes = SEASONS.map(
    (season) =>
      `:root[data-season='${season}'] { ${Object.entries(seasons[season])
        .map(([k, v]) => `--color-${k}: ${v};`)
        .join(' ')} }`,
  );
  return [`:root { ${vars.join(' ')} }`, ...themes].join('\n');
}
