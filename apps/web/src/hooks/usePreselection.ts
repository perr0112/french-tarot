import type { Card, PlayerView, Seat } from '@tarot/engine';
import { useEffect, useRef, useState } from 'react';
import type { Send } from '../net/connection';

/** How long the word that a preselected card was dropped stays shown. */
export const PRESELECTION_DROPPED_MS = 4000;

interface Preselection {
  readonly deal: number;
  readonly card: Card;
}

export interface PreselectionState {
  /** Whether a card of the hand may be preselected now: the play is on, someone else's turn. */
  readonly open: boolean;
  /** The card preselected for the coming turn, if any. */
  readonly card: Card | null;
  /** The card just dropped because it could not be played, while its word is shown. */
  readonly dropped: Card | null;
  /** Preselects a card, or cancels it when it is the one already preselected. */
  readonly toggle: (card: Card) => void;
}

/**
 * A card picked ahead of the local player's turn, kept in this page only (the server never
 * knows it). When the turn comes, the card is played at once if the rules allow it, dropped
 * with a word why if they do not, and kept raised, waiting for a click, when a poignée may be
 * declared with it: playing it alone would take that choice away.
 */
export function usePreselection({
  deal,
  dealNumber,
  me,
  send,
  paused,
}: {
  deal: PlayerView | null;
  dealNumber: number;
  me: Seat;
  send: Send;
  /** Between deals: nothing is preselected or played. */
  paused: boolean;
}): PreselectionState {
  const [preselection, setPreselection] = useState<Preselection | null>(null);
  const [dropped, setDropped] = useState<Card | null>(null);
  // The turn a preselected card was sent for: it is sent once, whatever renders follow.
  const sentFor = useRef<string | null>(null);

  const open = !paused && deal?.phase === 'playing' && deal.turn !== null && deal.turn !== me;
  const card =
    !paused &&
    preselection?.deal === dealNumber &&
    deal?.phase === 'playing' &&
    deal.hand.includes(preselection.card)
      ? preselection.card
      : null;
  const template = deal?.legalActions[0];
  const play = template?.type === 'playCard' ? template : null;
  const turnKey = `${dealNumber}:${deal?.hand.length ?? 0}`;
  const playable = card !== null && play !== null && play.cards.includes(card);
  const verdict =
    card === null || play === null ? null : !playable ? 'drop' : play.poignee ? 'wait' : 'play';

  useEffect(() => {
    if (card === null || verdict === null || verdict === 'wait') return;
    if (verdict === 'play') {
      if (sentFor.current === turnKey) return;
      sentFor.current = turnKey;
      send({ type: 'action', action: { type: 'playCard', card } });
    }
    // State changes go through a timer (the lint forbids them synchronously in an effect).
    const timer = setTimeout(() => {
      setPreselection(null);
      if (verdict === 'drop') setDropped(card);
    }, 0);
    return () => clearTimeout(timer);
  }, [card, verdict, turnKey, send]);

  useEffect(() => {
    if (dropped === null) return;
    const timer = setTimeout(() => setDropped(null), PRESELECTION_DROPPED_MS);
    return () => clearTimeout(timer);
  }, [dropped]);

  const toggle = (picked: Card) => {
    setDropped(null);
    setPreselection(card === picked ? null : { deal: dealNumber, card: picked });
  };

  return { open, card, dropped, toggle };
}
