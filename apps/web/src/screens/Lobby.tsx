import { BOT_LEVELS, BOT_SPEEDS, MAX_DEALS, type RoomView } from '@tarot/protocol';
import { useState } from 'react';
import ui from '../design/ui.module.css';
import { seatName } from '../lib/names';
import type { Send } from '../net/connection';
import { fr } from '../strings/fr';
import { LeaveButton } from '../components/LeaveButton';
import { ThemeMenu } from '../components/ThemeMenu';
import styles from './Lobby.module.css';

/** Seats and options before a session; only the host may change them (AGENTS.md §5). */
export function Lobby({
  view,
  send,
  onLeave,
}: {
  view: RoomView;
  send: Send;
  onLeave?: (() => void) | undefined;
}) {
  const host = view.you.isHost;
  const [copied, setCopied] = useState(false);
  const filled = view.seats.every((occupant) => occupant.kind !== 'empty');
  const copy = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true));
  };
  return (
    <main className={styles.lobby}>
      <header className={styles.head}>
        <h1 className={styles.title}>
          {fr.lobby.title} <span className={styles.code}>{view.code}</span>
        </h1>
        <button type="button" className={ui.button} onClick={copy}>
          {copied ? fr.lobby.copied : fr.lobby.copyLink}
        </button>
        <div className={styles.headActions}>
          {/* Each player's own: not a room option. */}
          <ThemeMenu />
          {onLeave && <LeaveButton confirm={false} onLeave={onLeave} />}
        </div>
      </header>

      <section className={ui.panel} aria-labelledby="seats">
        <h2 id="seats" className={ui.title}>
          {fr.lobby.seats}
        </h2>
        <ol className={styles.seats}>
          {view.seats.map((occupant, seat) => (
            <li key={seat} className={styles.seat}>
              <span className={ui.label}>{fr.lobby.seat(seat + 1)}</span>
              <span className={styles.occupant}>
                {occupant.kind === 'human' && (
                  <>
                    {occupant.nickname}
                    {seat === view.you.seat && ` ${fr.lobby.you}`}
                    {!occupant.connected && (
                      <span className={ui.label}> · {fr.lobby.disconnected}</span>
                    )}
                  </>
                )}
                {occupant.kind === 'bot' &&
                  (host ? (
                    <select
                      className={ui.field}
                      aria-label={fr.lobby.seat(seat + 1)}
                      value={occupant.level}
                      onChange={(e) =>
                        send({
                          type: 'setBot',
                          seat,
                          // "none" (remove the bot) matches no level.
                          level: BOT_LEVELS.find((level) => level === e.target.value) ?? null,
                        })
                      }
                    >
                      {BOT_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {fr.lobby.bot(seatName(view, seat), fr.botLevel[level])}
                        </option>
                      ))}
                      <option value="none">{fr.lobby.removeBot}</option>
                    </select>
                  ) : (
                    fr.lobby.bot(seatName(view, seat), fr.botLevel[occupant.level])
                  ))}
                {occupant.kind === 'empty' &&
                  (host ? (
                    <button
                      type="button"
                      className={ui.button}
                      onClick={() => send({ type: 'setBot', seat, level: 'medium' })}
                    >
                      {fr.lobby.addBot}
                    </button>
                  ) : (
                    <span className={ui.label}>{fr.lobby.empty}</span>
                  ))}
              </span>
            </li>
          ))}
        </ol>
        {view.waiting.length > 0 && (
          <p className={ui.label}>
            {fr.lobby.waiting} : {view.waiting.join(', ')}
          </p>
        )}
      </section>

      <section className={ui.panel} aria-labelledby="settings">
        <h2 id="settings" className={ui.title}>
          {fr.lobby.settings}
        </h2>
        <fieldset className={styles.settings} disabled={!host}>
          <label className={styles.setting}>
            <span>{fr.lobby.players}</span>
            <select
              className={ui.field}
              value={view.options.players}
              onChange={(e) =>
                send({
                  type: 'configure',
                  options: { players: Number(e.target.value) as 3 | 4 | 5 },
                })
              }
            >
              {[3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.setting}>
            <span>{fr.lobby.deals}</span>
            <input
              className={ui.field}
              type="number"
              min={1}
              max={MAX_DEALS}
              value={view.options.deals}
              onChange={(e) => {
                const deals = Math.round(Number(e.target.value));
                if (deals >= 1 && deals <= MAX_DEALS)
                  send({ type: 'configure', options: { deals } });
              }}
            />
          </label>
          <label className={styles.setting}>
            <span>{fr.lobby.chelem}</span>
            <input
              type="checkbox"
              checked={view.options.chelemAnnouncements}
              onChange={(e) =>
                send({ type: 'configure', options: { chelemAnnouncements: e.target.checked } })
              }
            />
          </label>
          <label className={styles.setting}>
            <span>{fr.lobby.speed}</span>
            <select
              className={ui.field}
              value={view.options.botSpeed}
              onChange={(e) =>
                send({
                  type: 'configure',
                  options: { botSpeed: e.target.value as (typeof BOT_SPEEDS)[number] },
                })
              }
            >
              {BOT_SPEEDS.map((speed) => (
                <option key={speed} value={speed}>
                  {fr.botSpeed[speed]}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      </section>

      {host ? (
        <div className={styles.start}>
          <button
            type="button"
            className={`${ui.button} ${ui.primary}`}
            disabled={!filled}
            onClick={() => send({ type: 'start' })}
          >
            {fr.lobby.start}
          </button>
          {!filled && <span className={styles.hint}>{fr.lobby.needSeats}</span>}
        </div>
      ) : (
        <p className={styles.hint}>{fr.lobby.hostOnly}</p>
      )}
    </main>
  );
}
