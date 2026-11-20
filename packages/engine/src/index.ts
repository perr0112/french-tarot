/**
 * Pure French Tarot rules engine (FFT rules).
 * No I/O, no DOM, no network; randomness only through a seed carried by actions.
 */
export * from './cards';
export * from './variant';
export * from './contracts';
export * from './deal';
export * from './deal-in-play';
export * from './favoured';
export * from './actions';
export * from './result';
export * from './play';
export * from './poignee';
export * from './scoring';
export * from './view';
export * from './session';
export { createRng, shuffle, type Rng } from './rng';
