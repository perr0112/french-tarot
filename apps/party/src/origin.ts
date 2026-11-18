/**
 * Whether a page at `origin` may open a room connection. `allowed` is a comma-separated list of
 * origins; a `*` stands for part of one host label (letters, digits, hyphens), as in Vercel's
 * preview addresses. A request without an origin (not from a browser page) is refused.
 */
export function isAllowedOrigin(origin: string | null, allowed: string | undefined): boolean {
  if (origin === null || !allowed) return false;
  return allowed
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '')
    .some((entry) => patternFor(entry).test(origin));
}

function patternFor(entry: string): RegExp {
  const literal = entry.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'));
  return new RegExp(`^${literal.join('[a-z0-9-]+')}$`, 'i');
}
