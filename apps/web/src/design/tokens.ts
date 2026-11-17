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
    positive: '#3F8F5A',
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
  radius: { sm: '6px', md: '10px', lg: '16px', card: '8px' },
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
  font: { ui: "'Inter Variable', system-ui, sans-serif" },
} as const;

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
  add('font-ui', tokens.font.ui);
  return `:root { ${vars.join(' ')} }`;
}
