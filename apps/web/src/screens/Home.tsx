import { MAX_NICKNAME_LENGTH } from '@tarot/protocol';
import { useState, type FormEvent } from 'react';
import ui from '../design/ui.module.css';
import { navigate, roomPath } from '../net/routing';
import { newRoomCode, normaliseRoomCode, ROOM_CODE_LENGTH, storage } from '../net/storage';
import { fr } from '../strings/fr';
import styles from './Home.module.css';

/** Pick a nickname, then create a table or join one with its code (AGENTS.md §5). */
export function Home() {
  const [nickname, setNickname] = useState(() => storage.nickname() ?? '');
  const [code, setCode] = useState('');
  const [missingNickname, setMissingNickname] = useState(false);

  const go = (roomCode: string) => {
    const name = nickname.trim();
    if (!name) return setMissingNickname(true);
    storage.saveNickname(name);
    navigate(roomPath(roomCode));
  };
  const join = (event: FormEvent) => {
    event.preventDefault();
    if (code.length === ROOM_CODE_LENGTH) go(code);
  };

  return (
    <main className={styles.home}>
      <h1 className={styles.title}>{fr.app.title}</h1>
      <p className={styles.tagline}>{fr.app.tagline}</p>
      <div className={`${ui.panel} ${styles.form}`}>
        <label className={styles.field}>
          <span className={ui.label}>{fr.home.nickname}</span>
          <input
            className={ui.field}
            value={nickname}
            maxLength={MAX_NICKNAME_LENGTH}
            autoComplete="nickname"
            onChange={(e) => {
              setNickname(e.target.value);
              setMissingNickname(false);
            }}
          />
        </label>
        {missingNickname && <p className={styles.error}>{fr.home.nicknameRequired}</p>}
        <button
          type="button"
          className={`${ui.button} ${ui.primary}`}
          onClick={() => go(newRoomCode())}
        >
          {fr.home.create}
        </button>
        <form className={styles.join} onSubmit={join}>
          <label className={styles.field}>
            <span className={ui.label}>{fr.home.code}</span>
            <input
              className={`${ui.field} ${styles.code}`}
              value={code}
              inputMode="text"
              autoCapitalize="characters"
              onChange={(e) => setCode(normaliseRoomCode(e.target.value))}
            />
          </label>
          <button type="submit" className={ui.button} disabled={code.length !== ROOM_CODE_LENGTH}>
            {fr.home.join}
          </button>
        </form>
      </div>
      <p className={styles.credit}>{fr.app.cardCredit}</p>
    </main>
  );
}
