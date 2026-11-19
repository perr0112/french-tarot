import type { Card } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import { TRICK_PAUSE_MS } from '@tarot/protocol';
import { useEffect, useState } from 'react';
import ui from '../design/ui.module.css';
import { DealResult } from '../components/DealResult';
import { Hand } from '../components/Hand';
import { InfoBar } from '../components/InfoBar';
import { ScoreSheet } from '../components/ScoreSheet';
import { SeatBadge } from '../components/SeatBadge';
import { Trick } from '../components/Trick';
import { seatName } from '../lib/names';
import { poigneeStatus } from '../lib/selection';
import { seatPositions } from '../lib/seats';
import type { Send } from '../net/connection';
import { DecisionPanel } from '../panels/DecisionPanel';
import { fr } from '../strings/fr';
import styles from './Table.module.css';

interface Selection {
  readonly key: string;
  readonly ecart: readonly Card[];
  readonly poignee: readonly Card[] | null;
}

const emptySelection = (key: string): Selection => ({ key, ecart: [], poignee: null });

/** The game table: opponents around, the trick in the centre, the local hand at the bottom. */
export function Table({
  view,
  send,
  dealtBeforeJoining = null,
}: {
  view: RoomView;
  send: Send;
  /** The deal already dealt when this page joined the table: it is shown, not dealt in again. */
  dealtBeforeJoining?: number | null;
}) {
  const deal = view.deal;
  const me = view.you.seat ?? 0;
  const positions = seatPositions(view.options.players, me);
  const template = deal?.legalActions[0];
  const [sheetOpen, setSheetOpen] = useState(false);

  // Selections belong to one decision of one deal: a new deal, decision or hand starts afresh.
  const dealNumber = view.session?.history.length ?? 0;
  const decisionKey = `${dealNumber}:${template?.type ?? 'none'}:${deal?.hand.length ?? 0}`;
  const [selection, setSelection] = useState<Selection>(() => emptySelection(decisionKey));
  const { ecart, poignee } =
    selection.key === decisionKey ? selection : emptySelection(decisionKey);
  const update = (change: Partial<Omit<Selection, 'key'>>) =>
    setSelection({ ecart, poignee, ...change, key: decisionKey });

  // Reviewing the last trick lasts until the next card is played.
  const cardsPlayed =
    (deal?.tricksWon.reduce((a, b) => a + b, 0) ?? 0) * view.options.players +
    (deal?.currentTrick?.cards.length ?? 0);
  const [reviewingAt, setReviewingAt] = useState<number | null>(null);
  const reviewLastTrick = reviewingAt === cardsPlayed;

  // A poignée being chosen must make a level before any card goes (it leaves with the card).
  const shownPoignee =
    template?.type === 'playCard' && template.poignee && poignee ? poignee : null;
  const poigneeReady =
    template?.type !== 'playCard' ||
    !template.poignee ||
    poignee === null ||
    poigneeStatus(template.poignee, poignee).level !== null;

  // Only cards that can be picked now are lit; the hand stays plain during other decisions.
  const active =
    template?.type === 'playCard'
      ? poigneeReady
        ? template.cards
        : []
      : template?.type === 'ecart'
        ? template.eligible
        : null;

  const pick = (card: Card) => {
    if (template?.type === 'ecart') {
      update({ ecart: ecart.includes(card) ? ecart.filter((c) => c !== card) : [...ecart, card] });
    } else if (template?.type === 'playCard' && poigneeReady) {
      send({
        type: 'action',
        action: {
          type: 'playCard',
          card,
          ...(shownPoignee ? { poignee: [...shownPoignee] } : {}),
        },
      });
    }
  };

  const betweenDeals = view.session?.continued != null;
  // A fresh deal: nobody has spoken yet, the hand is dealt in from the dealer's seat.
  const dealing =
    deal?.phase === 'bidding' && deal.bids.length === 0 && dealNumber !== dealtBeforeJoining
      ? { key: String(dealNumber), from: deal.dealer }
      : null;
  // A deal played to its end keeps its last trick shown for the usual pause, so its last card
  // lands and is seen, before the result (shown at once when the page opens on it).
  const lastTrickPause = betweenDeals && deal?.phase === 'finished' && deal.lastTrick !== null;
  const [resultFor, setResultFor] = useState<number | null>(() =>
    betweenDeals ? dealNumber : null,
  );
  const showsResult = betweenDeals && (!lastTrickPause || resultFor === dealNumber);
  useEffect(() => {
    if (!betweenDeals || resultFor === dealNumber) return;
    const timer = setTimeout(() => setResultFor(dealNumber), TRICK_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [betweenDeals, resultFor, dealNumber]);
  // After a trick, its cards stay in the centre until the next card is played.
  const showsLastTrick = reviewLastTrick || !deal?.currentTrick?.cards.length;
  const trick = showsLastTrick ? deal?.lastTrick : deal?.currentTrick;
  const turnName = deal?.turn != null && deal.turn !== me ? seatName(view, deal.turn) : null;

  return (
    <div className={styles.table}>
      <InfoBar
        view={view}
        showingLastTrick={reviewLastTrick}
        onToggleLastTrick={() => setReviewingAt(reviewLastTrick ? null : cardsPlayed)}
        onOpenSheet={() => setSheetOpen(true)}
      />
      <div className={styles.felt}>
        {view.seats.map((_, seat) =>
          seat === me ? null : (
            <SeatBadge
              key={seat}
              view={view}
              seat={seat}
              className={styles[positions[seat] ?? 'top']}
            />
          ),
        )}
        <div className={styles.centre}>
          {showsResult ? (
            <DealResult view={view} send={send} />
          ) : (
            deal && (
              <Trick
                cards={trick?.cards ?? []}
                winner={showsLastTrick ? (deal.lastTrick?.winner ?? null) : null}
                positions={positions}
                me={me}
                label={showsLastTrick && trick ? fr.table.lastTrick : fr.table.trick}
                caption={
                  showsLastTrick && deal?.lastTrick
                    ? fr.table.lastTrickWonBy(seatName(view, deal.lastTrick.winner))
                    : undefined
                }
                muted={reviewLastTrick}
                animated={!reviewLastTrick}
              />
            )
          )}
        </div>
      </div>
      <div className={styles.bottom}>
        {!betweenDeals && template && (
          <DecisionPanel
            // Each decision enters afresh (DESIGN.md §3.6: panel open).
            key={template.type}
            view={view}
            send={send}
            ecart={ecart}
            poignee={poignee}
            onPoigneeChange={(cards) => update({ poignee: cards })}
          />
        )}
        {!betweenDeals && !template && turnName && (
          <p className={styles.waiting}>{fr.table.waitingFor(turnName)}</p>
        )}
        <SeatBadge view={view} seat={me} />
        {deal && deal.phase !== 'finished' && (
          <Hand
            cards={deal.hand}
            active={betweenDeals ? null : active}
            selected={ecart}
            onPick={pick}
            dealing={dealing}
          />
        )}
      </div>
      {sheetOpen && (
        <aside className={`${styles.drawer} ${ui.slideIn}`} aria-label={fr.table.scoreSheet}>
          <div className={ui.panel}>
            <div className={styles.drawerHead}>
              <h2 className={ui.title}>{fr.table.scoreSheet}</h2>
              <button type="button" className={ui.button} onClick={() => setSheetOpen(false)}>
                {fr.table.close}
              </button>
            </div>
            <ScoreSheet view={view} />
          </div>
        </aside>
      )}
    </div>
  );
}
