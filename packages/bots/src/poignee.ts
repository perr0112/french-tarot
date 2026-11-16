import { EXCUSE, isTrump, type Card, type PoigneeTemplate } from '@tarot/engine';

/**
 * The poignée a bot shows: the highest level it may declare, with its weakest trumps;
 * the Excuse only when the trumps fall short (AGENTS.md §3.6).
 */
export function poigneeToShow(template: PoigneeTemplate | null): readonly Card[] | undefined {
  const level = template?.levels.at(-1);
  if (!template || !level) return undefined;
  const trumps = template.eligible.filter(isTrump);
  return trumps.length >= level.size ? trumps.slice(0, level.size) : [...trumps, EXCUSE];
}
