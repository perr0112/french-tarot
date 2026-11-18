/** Design tokens (DESIGN.md §3). Components use them through the CSS custom properties below. */
export const tokens = {
  color: {
    table: '#1F3A30',
    'table-edge': '#18302A',
    surface: '#FAFAF7',
    'surface-muted': '#F1F0EB',
    ink: '#1C1C1A',
    'ink-muted': '#6B6A65',
    'ink-on-table': '#F4F2EA',
    'ink-on-table-muted': '#B9C2BC',
    accent: '#E2B04A',
    'suit-red': '#C23B32',
    'suit-black': '#1C1C1A',
    'card-face': '#FFFDF8',
    'card-back': '#2C4A6B',
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
  radius: { sm: '6px', md: '10px', lg: '16px', card: '8% / 5%' },
  shadow: {
    card: '0 1px 2px rgb(0 0 0 / 0.18), 0 2px 6px rgb(0 0 0 / 0.12)',
    raised: '0 4px 12px rgb(0 0 0 / 0.22)',
    panel: '0 8px 24px rgb(0 0 0 / 0.16)',
  },
  duration: { instant: '100ms', fast: '180ms', base: '260ms', slow: '400ms' },
  ease: {
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
  border: { thin: '1px', thick: '2px', selected: '3px' },
  focus: { offset: '2px' },
  width: { narrow: '420px', regular: '560px', wide: '720px' },
  card: {
    hand: 'clamp(56px, 7vw, 84px)',
    trick: 'clamp(48px, 7vw, 80px)',
    mini: '32px',
    chip: '36px',
  },
  font: { ui: "'Inter Variable', system-ui, sans-serif" },
} as const;

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
  for (const [k, v] of Object.entries(tokens.border)) add(`border-${k}`, v);
  for (const [k, v] of Object.entries(tokens.focus)) add(`focus-${k}`, v);
  for (const [k, v] of Object.entries(tokens.width)) add(`width-${k}`, v);
  for (const [k, v] of Object.entries(tokens.card)) add(`card-${k}`, v);
  add('font-ui', tokens.font.ui);
  return `:root { ${vars.join(' ')} }`;
}
