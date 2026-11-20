import ui from '../design/ui.module.css';

/**
 * The colour of a score by its sign (DESIGN.md §3.1), on a light surface: green won, red lost,
 * the surrounding ink for zero. The sign is always written too: colour never says it alone.
 */
export const scoreTone = (value: number) =>
  value > 0 ? ui.positive : value < 0 ? ui.negative : '';

/** The colour of a contract's outcome: green made, red failed. */
export const madeTone = (made: boolean) => (made ? ui.positive : ui.negative);
