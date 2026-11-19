import type { Card, Seat } from '@tarot/engine';
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { sortHand } from '../lib/hand';
import { cardName } from '../lib/cards';
import {
  appear,
  dealStagger,
  flyIn,
  FROM_SEAT_SCALE,
  reducedMotion,
  layoutBox,
  rememberHandBox,
  seatBox,
  slideFrom,
} from '../motion/animate';
import type { Box } from '../motion/flip';
import { fr } from '../strings/fr';
import { CardFace } from './Card';
import styles from './Hand.module.css';

/** A deal being dealt in: `key` names the deal (it is dealt once), `from` is the dealer's seat. */
export interface Dealing {
  readonly key: string;
  readonly from: Seat;
}

export interface HandProps {
  readonly cards: readonly Card[];
  /** Cards that may be clicked now; null when the hand is only shown. */
  readonly active: readonly Card[] | null;
  /** Cards picked (écart); shown raised. */
  readonly selected?: readonly Card[];
  readonly onPick?: (card: Card) => void;
  /** Set at the start of a deal: the cards fly in from the dealer, one after the other. */
  readonly dealing?: Dealing | null;
}

const SKIP_EVENTS = ['pointerdown', 'keydown'] as const;

/**
 * Deals the slots in from the dealer's seat, one after the other, in `motion-deal` in all; a
 * click or a key finishes it at once. Returns what ends it early (the hand going away).
 */
function dealIn(slots: readonly HTMLElement[], from: Box | null): (() => void) | null {
  if (reducedMotion()) return null;
  const stagger = dealStagger(slots.length);
  const flights = slots
    .map((slot, i) => flyIn(slot, from, { delay: i * stagger, scale: FROM_SEAT_SCALE, fade: true }))
    .filter((f) => f !== null);
  if (flights.length === 0) return null;
  const unlisten = () =>
    SKIP_EVENTS.forEach((e) => window.removeEventListener(e, skip, { capture: true }));
  function skip() {
    unlisten();
    flights.forEach((f) => f.finish());
  }
  SKIP_EVENTS.forEach((e) => window.addEventListener(e, skip, { capture: true }));
  void Promise.all(flights.map((f) => f.finished)).then(unlisten, unlisten);
  return skip;
}

/** Moves the hand to its new layout: kept cards slide, new ones fade in (DESIGN.md §3.6). */
function settle(slots: readonly HTMLElement[], before: ReadonlyMap<Card, Box>) {
  for (const slot of slots) {
    const previous = before.get(slot.dataset.card as Card);
    if (previous) slideFrom(slot, previous);
    else if (before.size > 0) appear(slot);
  }
}

/** The local player's hand as a fan; unplayable cards dimmed and not clickable (AGENTS.md §6). */
export function Hand({ cards, active, selected = [], onPick, dealing = null }: HandProps) {
  const sorted = sortHand(cards);
  const list = useRef<HTMLUListElement>(null);
  const boxes = useRef<ReadonlyMap<Card, Box>>(new Map());
  const dealt = useRef<string | null>(null);
  const endDeal = useRef<(() => void) | null>(null);
  const handKey = sorted.join();
  const dealKey = dealing?.key ?? null;
  const dealer = dealing?.from ?? null;

  useLayoutEffect(() => {
    const root = list.current;
    if (!root) return;
    const slots = [...root.querySelectorAll<HTMLElement>('[data-card]')];
    const before = boxes.current;
    const now = new Map<Card, Box>();
    for (const slot of slots) {
      const card = slot.dataset.card as Card;
      const box = layoutBox(slot);
      now.set(card, box);
      rememberHandBox(card, box);
    }
    boxes.current = now;
    if (dealKey !== null && dealer !== null && dealt.current !== dealKey) {
      dealt.current = dealKey;
      endDeal.current = dealIn(slots, seatBox(dealer));
    } else {
      settle(slots, before);
    }
  }, [handKey, dealKey, dealer]);

  // A deal still flying in when the hand goes away is finished, and stops listening for a skip.
  useEffect(() => () => endDeal.current?.(), []);

  return (
    <ul
      ref={list}
      className={styles.hand}
      aria-label={fr.table.yourHand}
      style={{ '--count': cards.length } as CSSProperties}
    >
      {sorted.map((card) => {
        const enabled = active?.includes(card) ?? false;
        const picked = selected.includes(card);
        return (
          <li key={card} className={styles.slot} data-card={card}>
            <button
              type="button"
              className={`${styles.card} ${active && !enabled ? styles.dimmed : ''} ${enabled ? styles.enabled : ''} ${picked ? styles.picked : ''}`}
              disabled={!enabled}
              aria-pressed={selected.length > 0 || picked ? picked : undefined}
              aria-label={cardName(card)}
              onClick={(event) => {
                // The face as it stands now (lifted on hover), where a played card leaves from.
                const face = event.currentTarget.querySelector('svg');
                if (face) rememberHandBox(card, face.getBoundingClientRect());
                onPick?.(card);
              }}
            >
              <CardFace card={card} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
