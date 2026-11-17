import type { RoomView } from '@tarot/protocol';
import { formatScore } from '../lib/cards';
import { seatName } from '../lib/names';
import { fr } from '../strings/fr';
import styles from './ScoreSheet.module.css';

/** Every deal of the session and the running totals (AGENTS.md §5). */
export function ScoreSheet({ view }: { view: RoomView }) {
  const session = view.session;
  if (!session) return null;
  const seats = view.seats.map((_, seat) => seat);
  let played = 0;
  return (
    <table className={styles.sheet}>
      <thead>
        <tr>
          <th scope="col">{fr.sheet.deal}</th>
          <th scope="col">{fr.sheet.contract}</th>
          {seats.map((seat) => (
            <th key={seat} scope="col">
              {seatName(view, seat)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {session.history.map((record, i) => {
          const result = record.result;
          if (result) played++;
          return (
            <tr key={i} className={result ? '' : styles.cancelled}>
              <th scope="row">{result ? played : '—'}</th>
              <td>
                {result
                  ? `${fr.bid[result.contract]} · ${seatName(view, result.taker)} · ${result.made ? '✓' : '✗'}`
                  : fr.sheet.cancelled}
              </td>
              {seats.map((seat) => (
                <td key={seat} className={styles.number}>
                  {result ? formatScore(result.perSeat[seat] ?? 0) : ''}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" colSpan={2}>
            {fr.sheet.total}
          </th>
          {seats.map((seat) => (
            <td key={seat} className={styles.number}>
              {formatScore(session.totals[seat] ?? 0)}
            </td>
          ))}
        </tr>
      </tfoot>
    </table>
  );
}
