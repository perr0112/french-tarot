import type { Card, PlayerView, Seat } from '@tarot/engine';
import { useEffect, useState } from 'react';
import type { Send } from '../net/connection';

/** How long the word that a preselected card was dropped stays shown. */
export const PRESELECTION_DROPPED_MS = 4000;

/** A card picked ahead, for one trick of one deal. */
interface Preselection {
  readonly deal: number;
  readonly trick: number;
  readonly card: Card;
}

export interface PreselectionState {
  /** Whether a card may be preselected now: someone else is to play in a trick not yet played. */
  readonly available: boolean;
  /** The card preselected for this trick, if any. */
  readonly card: Card | null;
  /** The card just dropped because it could not be played, while its word is shown. */
  readonly dropped: Card | null;
  /** Preselects a card, or cancels it when it is the one already preselected. */
  readonly toggle: (card: Card) => void;
}

/**
 * A card picked ahead of the local player's turn, kept in this page only (the server never
 * knows it). It is picked while another player is to play in a trick the local player has not
 * played in yet, so the suit led is known (never a lead chosen blind). When the turn comes, the
 * card is played if the rules allow it, dropped with a word why if they do not, and kept raised,
 * waiting for a click, when a poignée may be declared with it: playing it alone would take that
 * choice away. It holds for that trick only.
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

  const playing = !paused && deal?.phase === 'playing';
  const trick = deal?.tricksWon.reduce((a, b) => a + b, 0) ?? 0;
  const playedInTrick = deal?.currentTrick?.cards.some((p) => p.seat === me) ?? false;
  const available =
    playing && deal.turn !== null && deal.turn !== me && !playedInTrick && deal.hand.length > 0;
  const card =
    playing &&
    preselection?.deal === dealNumber &&
    preselection.trick === trick &&
    !playedInTrick &&
    deal.hand.includes(preselection.card)
      ? preselection.card
      : null;
  const template = deal?.legalActions[0];
  const play = template?.type === 'playCard' ? template : null;
  const outcome =
    card === null || play === null
      ? null
      : !play.cards.includes(card)
        ? 'drop'
        : play.poignee
          ? 'wait'
          : 'play';

  // Through a timer: one send even when the effect runs twice (StrictMode) or is redone by a
  // render before it fires, and the state changes outside the effect's own run.
  useEffect(() => {
    if (card === null || outcome === null || outcome === 'wait') return;
    const timer = setTimeout(() => {
      setPreselection(null);
      if (outcome === 'play') send({ type: 'action', action: { type: 'playCard', card } });
      else setDropped(card);
    }, 0);
    return () => clearTimeout(timer);
  }, [card, outcome, send]);

  useEffect(() => {
    if (dropped === null) return;
    const timer = setTimeout(() => setDropped(null), PRESELECTION_DROPPED_MS);
    return () => clearTimeout(timer);
  }, [dropped]);

  const toggle = (picked: Card) => {
    setDropped(null);
    setPreselection(card === picked ? null : { deal: dealNumber, trick, card: picked });
  };

  return { available, card, dropped: paused ? null : dropped, toggle };
}
