import type { ClientMessage, RoomView, ServerErrorCode, ServerMessage } from '@tarot/protocol';
import PartySocket from 'partysocket';
import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from './storage';

/** Sends one message to the room; panels get it injected so tests need no network. */
export type Send = (message: ClientMessage) => void;

export type ConnectionStatus =
  | 'connecting'
  | 'open'
  | 'reconnecting'
  /** The nickname is taken: the player must choose another. */
  | 'nicknameTaken'
  /** The room refused us for good (session in progress, opened elsewhere). */
  | 'refused';

const PARTY_HOST: string = import.meta.env.VITE_PARTY_HOST ?? 'localhost:8787';
const FINAL_ERRORS: ReadonlySet<ServerErrorCode> = new Set([
  'SESSION_IN_PROGRESS',
  'REPLACED_BY_NEW_CONNECTION',
]);

export interface RoomConnection {
  readonly status: ConnectionStatus;
  readonly view: RoomView | null;
  /** The last error the room answered, until dismissed. */
  readonly error: ServerErrorCode | null;
  readonly send: Send;
  readonly dismissError: () => void;
}

/** One attempt to sit at the table; a new object retries, even with the same nickname. */
export interface JoinRequest {
  readonly nickname: string;
}

/** Joins room `code` as the requested nickname (or by the stored token), keeps the latest snapshot. */
export function useRoomConnection(code: string, request: JoinRequest | null): RoomConnection {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [view, setView] = useState<RoomView | null>(null);
  const [error, setError] = useState<ServerErrorCode | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    if (request === null) return;
    const { nickname } = request;
    const socket = new PartySocket({ host: PARTY_HOST, party: 'room', room: code });
    socketRef.current = socket;
    let final = false;

    socket.addEventListener('open', () => {
      setStatus('open');
      const token = storage.token(code);
      socket.send(JSON.stringify({ type: 'join', nickname, ...(token ? { token } : {}) }));
    });
    socket.addEventListener('close', () => {
      if (!final) setStatus('reconnecting');
    });
    socket.addEventListener('message', (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as ServerMessage;
      if (message.type === 'welcome') storage.saveToken(code, message.token);
      else if (message.type === 'state') setView(message.view);
      else if (message.code === 'NICKNAME_TAKEN') {
        final = true;
        setStatus('nicknameTaken');
        socket.close();
      } else {
        setError(message.code);
        if (FINAL_ERRORS.has(message.code)) {
          final = true;
          setStatus('refused');
          socket.close();
        }
      }
    });
    return () => {
      final = true;
      socket.close();
      socketRef.current = null;
    };
  }, [code, request]);

  const send = useCallback<Send>((message) => {
    socketRef.current?.send(JSON.stringify(message));
  }, []);
  const dismissError = useCallback(() => setError(null), []);
  return { status, view, error, send, dismissError };
}
