import {
  EXCUSE,
  isTrump,
  trumpValue,
  type Card,
  type LegalAction,
  type PoigneeLevel,
  type PoigneeTemplate,
} from '@tarot/engine';

type EcartTemplate = Extract<LegalAction, { type: 'ecart' }>;

export interface EcartStatus {
  readonly ready: boolean;
  /** Cards still to choose (negative when too many are chosen). */
  readonly missing: number;
  /** A trump is chosen while another eligible card is left out (AGENTS.md §3.4). */
  readonly trumpsTooSoon: boolean;
}

export function ecartStatus(template: EcartTemplate, selected: readonly Card[]): EcartStatus {
  const missing = template.count - selected.length;
  const plainLeft = template.eligible.some((c) => !isTrump(c) && !selected.includes(c));
  const trumpsTooSoon = selected.some(isTrump) && plainLeft;
  const allEligible = selected.every((c) => template.eligible.includes(c));
  return { ready: missing === 0 && !trumpsTooSoon && allEligible, missing, trumpsTooSoon };
}

const byValue = (a: Card, b: Card) => (trumpValue(a) ?? 0) - (trumpValue(b) ?? 0);

/** The weakest trumps for a level; the Excuse only when the trumps fall short (AGENTS.md §3.6). */
export function defaultPoignee(template: PoigneeTemplate, level: PoigneeLevel): Card[] {
  const size = template.levels.find((l) => l.level === level)?.size ?? 0;
  const trumps = template.eligible.filter(isTrump).sort(byValue);
  return trumps.length >= size ? trumps.slice(0, size) : [...trumps, EXCUSE].slice(0, size);
}

export interface PoigneeStatus {
  /** The level these cards make, or null if they make none. */
  readonly level: PoigneeLevel | null;
  /** The Excuse is shown although enough trumps are held. */
  readonly excuseNotAllowed: boolean;
}

export function poigneeStatus(template: PoigneeTemplate, selected: readonly Card[]): PoigneeStatus {
  const trumpsHeld = template.eligible.filter(isTrump).length;
  const excuseNotAllowed = selected.includes(EXCUSE) && trumpsHeld >= selected.length;
  const level = template.levels.find((l) => l.size === selected.length)?.level ?? null;
  return { level: excuseNotAllowed ? null : level, excuseNotAllowed };
}
