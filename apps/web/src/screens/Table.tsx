import type { Card } from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import { useState } from 'react';
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
export function Table({ view, send }: { view: RoomView; send: Send }) {
  const deal = view.deal;
  const me = view.you.seat ?? 0;
  const positions = seatPositions(view.options.players, me);
  const template = deal?.legalActions[0];
  const [sheetOpen, setSheetOpen] = useState(false);

  // Selections belong to one decision: a new decision (or a new hand) starts from scratch.
  const decisionKey = `${template?.type ?? 'none'}:${deal?.hand.length ?? 0}`;
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

  // Only cards that can be picked now are lit; the hand stays plain during other decisions.
  const active =
    template?.type === 'playCard'
      ? template.cards
      : template?.type === 'ecart'
        ? template.eligible
        : null;

  const pick = (card: Card) => {
    if (template?.type === 'ecart') {
      update({ ecart: ecart.includes(card) ? ecart.filter((c) => c !== card) : [...ecart, card] });
    } else if (template?.type === 'playCard') {
      const shown =
        poignee && template.poignee && poigneeStatus(template.poignee, poignee).level
          ? poignee
          : null;
      send({
        type: 'action',
        action: { type: 'playCard', card, ...(shown ? { poignee: [...shown] } : {}) },
      });
    }
  };

  const betweenDeals = view.session?.continued != null;
  // After a trick, its cards stay in the centre until the next card is played.
  const trick = reviewLastTrick
    ? deal?.lastTrick?.cards
    : deal?.currentTrick?.cards.length
      ? deal.currentTrick.cards
      : deal?.lastTrick?.cards;
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
          {betweenDeals ? (
            <DealResult view={view} send={send} />
          ) : (
            trick && (
              <Trick
                cards={trick}
                positions={positions}
                label={reviewLastTrick ? fr.table.lastTrick : fr.table.trick}
              />
            )
          )}
        </div>
      </div>
      <div className={styles.bottom}>
        {!betweenDeals && template && (
          <DecisionPanel
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
          />
        )}
      </div>
      {sheetOpen && (
        <aside className={styles.drawer} aria-label={fr.table.scoreSheet}>
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
