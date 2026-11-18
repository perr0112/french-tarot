/** Per-viewer conveniences kept in localStorage; every access may fail (private mode). */
const safe = <T>(read: () => T, fallback: T): T => {
  try {
    return read();
  } catch {
    return fallback;
  }
};

const tokenKey = (code: string) => `tarot:token:${code}`;
const NICKNAME_KEY = 'tarot:nickname';

export const storage = {
  token: (code: string) => safe(() => localStorage.getItem(tokenKey(code)), null),
  saveToken: (code: string, token: string) =>
    safe(() => localStorage.setItem(tokenKey(code), token), undefined),
  nickname: () => safe(() => localStorage.getItem(NICKNAME_KEY), null),
  saveNickname: (nickname: string) =>
    safe(() => localStorage.setItem(NICKNAME_KEY, nickname), undefined),
};

/** Room codes avoid look-alike characters (0/O, 1/I/L). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;

export function newRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export const normaliseRoomCode = (input: string) =>
  input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
