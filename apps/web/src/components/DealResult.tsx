import type { RoomView } from '@tarot/protocol';
import ui from '../design/ui.module.css';
import { formatPoints, formatScore } from '../lib/cards';
import { sortHand } from '../lib/hand';
import { seatName } from '../lib/names';
import { madeTone, scoreTone } from '../lib/score';
import type { Send } from '../net/connection';
import { fr } from '../strings/fr';
import { ChienCards } from './Chien';
import { ReadyButton } from './ReadyButton';
import styles from './DealResult.module.css';

/**
 * The last deal explained, term by term, like a line of the score sheet (AGENTS.md §3.8, §6),
 * and the way to the next one. What each seat scored is shown at its seat (SeatBadge).
 */
export function DealResult({ view, send }: { view: RoomView; send: Send }) {
  const session = view.session;
  const record = session?.history.at(-1);
  if (!session || !record) return null;
  const result = record.result;
  // The deal is over: everyone sees what the chien held, a garde sans's or contre's too, or one
  // nobody took (AGENTS.md §3.3); a petit sec's stays hidden (the view gives none).
  const chien = view.deal?.chien ?? null;
  const signed = (value: number) => <span className={scoreTone(value)}>{formatScore(value)}</span>;
  return (
    <section className={`${ui.panel} ${ui.enter} ${styles.result}`} aria-label={fr.result.title}>
      <h2 className={ui.title}>{result ? fr.result.title : fr.result.cancelled}</h2>
      {result ? (
        <>
          <p className={styles.headline}>
            <span>{fr.table.contract(fr.bid[result.contract], seatName(view, result.taker))}</span>
            <strong className={madeTone(result.made)}>
              {result.made ? fr.result.made(result.gap) : fr.result.failed(result.gap)}
            </strong>
          </p>
          <p className={`${ui.label} ${styles.points}`}>
            {fr.result.points(formatPoints(result.points), result.needed, result.oudlers)}
          </p>
          <dl className={styles.terms}>
            <dt>
              {fr.result.contractScore}{' '}
              <span className={ui.label}>
                {fr.result.contractLine(result.gap, result.multiplier)}
              </span>
            </dt>
            <dd>{signed(result.contractScore)}</dd>
            {result.petitAuBout !== 0 && (
              <>
                <dt>{fr.result.petitAuBout}</dt>
                <dd>{signed(result.petitAuBout)}</dd>
              </>
            )}
            {result.poignee !== 0 && (
              <>
                <dt>{fr.result.poignee}</dt>
                <dd>{signed(result.poignee)}</dd>
              </>
            )}
            {result.chelem !== 0 && (
              <>
                <dt>{fr.result.chelem}</dt>
                <dd>{signed(result.chelem)}</dd>
              </>
            )}
            <dt className={styles.total}>{fr.result.dealScore}</dt>
            <dd className={styles.total}>{signed(result.dealScore)}</dd>
          </dl>
        </>
      ) : (
        <p>
          {record.cancelled?.reason === 'petitSec'
            ? fr.result.petitSec(seatName(view, record.cancelled.seat))
            : fr.result.allPassed}
        </p>
      )}
      {chien && (
        <figure className={styles.chienFigure}>
          <ol className={styles.chien} role="group" aria-label={fr.table.chien}>
            <ChienCards chien={{ faceUp: true, cards: sortHand(chien) }} />
          </ol>
          <figcaption className={ui.label}>{fr.table.chien}</figcaption>
        </figure>
      )}
      {session.continued && (
        <ReadyButton
          view={view}
          ready={session.continued}
          label={fr.result.continue}
          onReady={() => send({ type: 'continue' })}
        />
      )}
    </section>
  );
}
