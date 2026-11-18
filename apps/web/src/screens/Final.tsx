import type { RoomView } from '@tarot/protocol';
import ui from '../design/ui.module.css';
import { DealResult } from '../components/DealResult';
import { ScoreSheet } from '../components/ScoreSheet';
import { formatScore } from '../lib/cards';
import { seatName } from '../lib/names';
import type { Send } from '../net/connection';
import { fr } from '../strings/fr';
import styles from './Final.module.css';

/** Final ranking and score sheet; the host may start again (AGENTS.md §5). */
export function Final({ view, send }: { view: RoomView; send: Send }) {
  const totals = view.session?.totals ?? [];
  const ranking = totals.map((total, seat) => ({ seat, total })).sort((a, b) => b.total - a.total);
  return (
    <main className={styles.final}>
      <h1 className={styles.title}>{fr.final.title}</h1>
      {/* The last deal ends the session: its breakdown is shown here (AGENTS.md §6). */}
      <DealResult view={view} send={send} />
      <ol className={styles.ranking}>
        {ranking.map(({ seat, total }, i) => {
          // Equal totals share a rank.
          const rank = ranking.findIndex((r) => r.total === total) + 1;
          return (
            <li key={seat} className={i === 0 ? styles.first : ''}>
              <span className={styles.rank}>{fr.final.rank(rank)}</span>
              <span>{seatName(view, seat)}</span>
              <span className={styles.total}>{formatScore(total)}</span>
            </li>
          );
        })}
      </ol>
      <div className={ui.panel}>
        <ScoreSheet view={view} />
      </div>
      {view.you.isHost ? (
        <div className={ui.row}>
          <button
            type="button"
            className={`${ui.button} ${ui.primary}`}
            onClick={() => send({ type: 'newSession' })}
          >
            {fr.final.newSession}
          </button>
          <button type="button" className={ui.button} onClick={() => send({ type: 'backToLobby' })}>
            {fr.final.backToLobby}
          </button>
        </div>
      ) : (
        <p className={styles.hint}>{fr.final.hostDecides}</p>
      )}
    </main>
  );
}
