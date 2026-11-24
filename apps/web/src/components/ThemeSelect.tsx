import { SEASONS } from '../design/tokens';
import ui from '../design/ui.module.css';
import { seasonOf, setThemePreference, useThemePreference } from '../lib/theme';
import { fr } from '../strings/fr';
import styles from './ThemeSelect.module.css';

/** The table's theme for this player: the season of the day, or one season (DESIGN.md §3.1). */
export function ThemeSelect({ className }: { className?: string | undefined }) {
  const preference = useThemePreference();
  return (
    <label className={`${styles.theme} ${className ?? ''}`}>
      <span className={styles.label}>{fr.theme.label}</span>
      <select
        className={`${ui.field} ${styles.select}`}
        value={preference}
        onChange={(event) => {
          const value = event.target.value;
          setThemePreference(
            value === 'auto' ? 'auto' : (SEASONS.find((s) => s === value) ?? 'auto'),
          );
        }}
      >
        <option value="auto">{fr.theme.auto(fr.theme.seasons[seasonOf(new Date())])}</option>
        {SEASONS.map((season) => (
          <option key={season} value={season}>
            {fr.theme.seasons[season]}
          </option>
        ))}
      </select>
    </label>
  );
}
