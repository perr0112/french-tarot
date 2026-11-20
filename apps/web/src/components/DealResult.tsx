import type { RoomView } from '@tarot/protocol';
import ui from '../design/ui.module.css';
import { formatPoints, formatScore } from '../lib/cards';
import { seatName } from '../lib/names';
import type { Send } from '../net/connection';
import { fr } from '../strings/fr';
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
  const me = view.you.seat;
  const waiting = view.seats.flatMap((occupant, seat) =>
    // The local player has their own button.
    seat !== me &&
    occupant.kind === 'human' &&
    occupant.connected &&
    !session.continued?.includes(seat)
      ? [seatName(view, seat)]
      : [],
  );
  const signed = (value: number) => (
    <span className={value > 0 ? ui.positive : value < 0 ? ui.negative : ''}>
      {formatScore(value)}
    </span>
  );
  return (
    <section className={`${ui.panel} ${ui.enter} ${styles.result}`} aria-label={fr.result.title}>
      <h2 className={ui.title}>{result ? fr.result.title : fr.result.cancelled}</h2>
      {result ? (
        <>
          <p className={styles.headline}>
            <span>{fr.table.contract(fr.bid[result.contract], seatName(view, result.taker))}</span>
            <strong className={result.made ? ui.positive : ui.negative}>
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
      {session.continued && (
        <div className={ui.row}>
          {me !== null && !session.continued.includes(me) && (
            <button
              type="button"
              className={`${ui.button} ${ui.primary}`}
              onClick={() => send({ type: 'continue' })}
            >
              {fr.result.continue}
            </button>
          )}
          {waiting.length > 0 && (
            <span className={ui.label}>{fr.result.waitingFor(waiting.join(', '))}</span>
          )}
        </div>
      )}
    </section>
  );
}
