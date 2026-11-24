import { useEffect, useRef, useState } from 'react';
import {
  seasonOf,
  setAnimations,
  setThemePreference,
  useAnimations,
  useSeason,
  useThemePreference,
  type ThemePreference,
} from '../lib/theme';
import { fr } from '../strings/fr';
import { SEASON_THEMES, SEASONS } from '../themes/seasons';
import styles from './ThemeMenu.module.css';

/**
 * This player's theme (DESIGN.md §3.1): the season of the day or one of the four, each shown by
 * its colour, and the drifting decorations on or off. Kept in the browser; the room never
 * knows it. Escape, a click elsewhere or a choice closes it, the focus back on its button.
 */
export function ThemeMenu({ className }: { className?: string | undefined }) {
  const preference = useThemePreference();
  const season = useSeason();
  const animations = useAnimations();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const checked = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    checked.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };
  const choose = (next: ThemePreference) => {
    setThemePreference(next);
    close();
  };
  const choices: readonly ThemePreference[] = ['auto', ...SEASONS];

  return (
    <div ref={root} className={`${styles.menu} ${className ?? ''}`}>
      <button
        ref={toggle}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.swatch} style={{ background: SEASON_THEMES[season].swatch }} />
        {fr.theme.label}
      </button>
      {open && (
        <div
          className={styles.panel}
          role="group"
          aria-label={fr.theme.label}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close();
          }}
        >
          <div role="radiogroup" aria-label={fr.theme.label} className={styles.choices}>
            {choices.map((choice) => {
              const shown = choice === 'auto' ? seasonOf(new Date()) : choice;
              return (
                <button
                  key={choice}
                  ref={choice === preference ? checked : undefined}
                  type="button"
                  role="radio"
                  aria-checked={choice === preference}
                  className={styles.choice}
                  onClick={() => choose(choice)}
                >
                  <span
                    className={styles.swatch}
                    style={{ background: SEASON_THEMES[shown].swatch }}
                  />
                  {choice === 'auto'
                    ? fr.theme.auto(fr.theme.seasons[shown])
                    : fr.theme.seasons[choice]}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={animations}
            className={styles.switch}
            onClick={() => setAnimations(!animations)}
          >
            {fr.theme.animations}
            <span className={styles.track} aria-hidden="true">
              <span className={styles.thumb} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
