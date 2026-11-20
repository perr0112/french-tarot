import { MAX_NICKNAME_LENGTH } from '@tarot/protocol';
import { useEffect, useState, type FormEvent } from 'react';
import ui from '../design/ui.module.css';
import { errorMessage } from '../lib/errors';
import { useRoomConnection, type JoinRequest } from '../net/connection';
import { navigate } from '../net/routing';
import { storage } from '../net/storage';
import { fr } from '../strings/fr';
import { Final } from './Final';
import { Lobby } from './Lobby';
import { Table } from './Table';
import styles from './Room.module.css';

const ERROR_SHOWN_MS = 4000;

/** One room: asks for a nickname if needed, then shows the lobby, the table or the ranking. */
export function Room({ code }: { code: string }) {
  const [request, setRequest] = useState<JoinRequest | null>(() => {
    const nickname = storage.nickname();
    return nickname === null ? null : { nickname };
  });
  const { status, view, error, send, dismissError, leave } = useRoomConnection(code, request);
  const onLeave = () => {
    leave();
    navigate('/');
  };

  // The deal in play when this page first saw the table (a reload, a link opened mid-deal): it
  // is shown as it is, not dealt in again. undefined until the first view.
  const [dealtBeforeJoining, setDealtBeforeJoining] = useState<number | null | undefined>();
  if (view && dealtBeforeJoining === undefined) {
    setDealtBeforeJoining(
      view.phase === 'playing' && view.deal && view.session?.continued == null
        ? (view.session?.history.length ?? 0)
        : null,
    );
  }

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(dismissError, ERROR_SHOWN_MS);
    return () => clearTimeout(timer);
  }, [error, dismissError]);

  if (request === null || status === 'nicknameTaken') {
    return (
      <NicknameForm
        taken={status === 'nicknameTaken'}
        onSubmit={(name) => {
          storage.saveNickname(name);
          setRequest({ nickname: name });
        }}
      />
    );
  }
  if (status === 'refused') {
    return (
      <main className={styles.message}>
        <p>{error ? errorMessage(error) : fr.connection.reconnecting}</p>
        <button type="button" className={ui.button} onClick={() => navigate('/')}>
          {fr.connection.backHome}
        </button>
      </main>
    );
  }

  return (
    <>
      {status !== 'open' && (
        <p className={styles.banner} role="status">
          {view ? fr.connection.reconnecting : fr.connection.connecting}
        </p>
      )}
      {error && (
        <p className={styles.toast} role="alert">
          {errorMessage(error)}
        </p>
      )}
      {view?.phase === 'lobby' && <Lobby view={view} send={send} onLeave={onLeave} />}
      {view?.phase === 'playing' && (
        <Table
          view={view}
          send={send}
          dealtBeforeJoining={dealtBeforeJoining ?? null}
          onLeave={onLeave}
        />
      )}
      {view?.phase === 'finished' && <Final view={view} send={send} onLeave={onLeave} />}
    </>
  );
}

function NicknameForm({ taken, onSubmit }: { taken: boolean; onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };
  return (
    <main className={styles.message}>
      <form className={`${ui.panel} ${styles.form}`} onSubmit={submit}>
        <label className={styles.field}>
          <span className={ui.label}>{fr.connection.chooseNickname}</span>
          <input
            className={ui.field}
            value={name}
            maxLength={MAX_NICKNAME_LENGTH}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {taken && <p className={styles.error}>{fr.errors.NICKNAME_TAKEN}</p>}
        <button type="submit" className={`${ui.button} ${ui.primary}`}>
          {fr.connection.sit}
        </button>
      </form>
    </main>
  );
}
