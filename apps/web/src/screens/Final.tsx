import type { RoomView } from '@tarot/protocol';
import ui from '../design/ui.module.css';
import { CardFace } from '../components/Card';
import { DealResult } from '../components/DealResult';
import { LeaveButton } from '../components/LeaveButton';
import { ScoreSheet } from '../components/ScoreSheet';
import { formatScore } from '../lib/cards';
import { seatName } from '../lib/names';
import { podiumCard, rankSeats } from '../lib/ranking';
import type { Send } from '../net/connection';
import { fr } from '../strings/fr';
import styles from './Final.module.css';

/**
 * The end of a session on the felt (AGENTS.md §5): each player receives a card by rank — the 21
 * to the winner, down to the Excuse for the last — then the score sheet, and the last deal
 * folded away. The host may start again.
 */
export function Final({
  view,
  send,
  onLeave,
}: {
  view: RoomView;
  send: Send;
  onLeave?: (() => void) | undefined;
}) {
  const ranking = rankSeats(view.session?.totals ?? []);
  const lastRank = ranking.at(-1)?.rank ?? 1;
  const winners = ranking.filter((r) => r.rank === 1).map((r) => seatName(view, r.seat));
  return (
    <main className={styles.final}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>{fr.final.title}</p>
        <h1 className={styles.title}>
          {winners.length === 1 ? fr.final.winner(winners[0] ?? '') : fr.final.tie(winners)}
        </h1>
      </header>
      <ol className={styles.podium} aria-label={fr.final.ranking}>
        {ranking.map(({ seat, total, rank }) => (
          <li key={seat} className={rank === 1 ? styles.first : ''}>
            <span className={styles.card}>
              <CardFace card={podiumCard(rank, lastRank)} />
            </span>
            <span className={styles.rank}>{fr.final.rank(rank)}</span>
            <span className={styles.name}>{seatName(view, seat)}</span>
            <span className={`${styles.total} ${total < 0 ? styles.negative : ''}`}>
              {formatScore(total)}
            </span>
          </li>
        ))}
      </ol>
      {view.you.isHost ? (
        <div className={`${ui.row} ${styles.actions}`}>
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
          {onLeave && <LeaveButton confirm={false} onLeave={onLeave} />}
        </div>
      ) : (
        <div className={`${ui.row} ${styles.actions}`}>
          <p className={styles.hint}>{fr.final.hostDecides}</p>
          {onLeave && <LeaveButton confirm={false} onLeave={onLeave} />}
        </div>
      )}
      <div className={ui.panel}>
        <ScoreSheet view={view} />
      </div>
      {/* The last deal ends the session: its breakdown stays at hand (AGENTS.md §6). */}
      <details className={styles.lastDeal}>
        <summary>{fr.final.lastDeal}</summary>
        <DealResult view={view} send={send} />
      </details>
    </main>
  );
}
