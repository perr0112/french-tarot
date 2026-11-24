import type { Drift, Season } from './seasons';

/**
 * The seasons' small drawings, in `currentColor`: the motif by each corner of the mat (in its
 * 20 × 20 box) and what drifts over the felt (in a 24 × 24 box).
 */
export function SeasonMotif({ season }: { season: Season }) {
  switch (season) {
    case 'spring':
      // A flower: four petals round a heart.
      return (
        <g fill="currentColor">
          <circle cx="10" cy="7" r="1.6" />
          <circle cx="13" cy="10" r="1.6" />
          <circle cx="10" cy="13" r="1.6" />
          <circle cx="7" cy="10" r="1.6" />
          <circle cx="10" cy="10" r="1" opacity="0.6" />
        </g>
      );
    case 'summer':
      // A sun and its rays.
      return (
        <g>
          <circle cx="10" cy="10" r="2.4" fill="currentColor" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            d="M10 5v1.6M10 13.4V15M5 10h1.6M13.4 10H15M6.5 6.5l1.1 1.1M12.4 12.4l1.1 1.1M6.5 13.5l1.1-1.1M12.4 7.6l1.1-1.1"
          />
        </g>
      );
    case 'autumn':
      // An oak leaf, its vein down the middle.
      return (
        <g>
          <path fill="currentColor" d="M6 6 q7 1 8 8 q-7 -1 -8 -8z" />
        </g>
      );
    case 'winter':
      // A snowflake.
      return (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          d="M6 10h8M8 6.5l4 7M12 6.5l-4 7"
        />
      );
  }
}

/** One drifting thing, as an SVG of its own (SeasonalAmbience sizes and moves it). */
export function DriftShape({ shape, color }: { shape: Drift['shape']; color: string }) {
  switch (shape) {
    case 'petal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill={color} d="M12 2C7 7 6 14 12 22c6-8 5-15 0-20Z" />
          <path fill="none" stroke="rgb(0 0 0 / 0.08)" strokeWidth="0.8" d="M12 4v16" />
        </svg>
      );
    case 'firefly':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill={color} opacity="0.18" />
          <circle cx="12" cy="12" r="5" fill={color} opacity="0.5" />
          <circle cx="12" cy="12" r="2.5" fill={color} />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill={color}
            d="M12 2c2 2 4 1 5 3s-1 3 1 5-2 3 0 5-3 3-4 5c-1 2-1 2-2 2s-1 0-2-2c-1-2-6-3-4-5s-2-3 0-5-1-3 1-5 3-1 5-3Z"
          />
          <path fill="none" stroke="rgb(0 0 0 / 0.2)" strokeWidth="0.9" d="M12 5v18" />
        </svg>
      );
    case 'flake':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10" />
            <path d="M12 5l-2-2M12 5l2-2M12 19l-2 2M12 19l2 2" />
          </g>
        </svg>
      );
  }
}
