import {
  CONTRACT_RULES,
  CONTRACTS,
  type BidChoice,
  type Card,
  type LegalAction,
  type PoigneeLevel,
  type PoigneeTemplate,
} from '@tarot/engine';
import type { RoomView } from '@tarot/protocol';
import ui from '../design/ui.module.css';
import { BidIcon } from '../components/BidIcon';
import { CardFace } from '../components/Card';
import { cardName } from '../lib/cards';
import { defaultPoignee, ecartStatus, poigneeStatus } from '../lib/selection';
import type { Send } from '../net/connection';
import { fr } from '../strings/fr';
import styles from './panels.module.css';

export interface DecisionPanelProps {
  readonly view: RoomView;
  readonly send: Send;
  /** Cards picked in the hand for the écart. */
  readonly ecart: readonly Card[];
  /** Trumps chosen to show with the first card, or null when no poignée is declared. */
  readonly poignee: readonly Card[] | null;
  readonly onPoigneeChange: (cards: readonly Card[] | null) => void;
}

/** The decision the game waits on from this player, docked above the hand (DESIGN.md §2). */
export function DecisionPanel({ view, send, ecart, poignee, onPoigneeChange }: DecisionPanelProps) {
  const template: LegalAction | undefined = view.deal?.legalActions[0];
  if (!template) return null;
  switch (template.type) {
    case 'bid': {
      const bid = (contract: BidChoice) =>
        send({ type: 'action', action: { type: 'bid', contract } });
      return (
        <section className={styles.panel} aria-label={fr.panels.bid}>
          <p className={styles.title}>{fr.panels.bid}</p>
          {/* Always the four contracts, rising, in the same places: one outbid stays, disabled. */}
          <div className={styles.contracts} role="group" aria-label={fr.panels.contracts}>
            {CONTRACTS.map((contract, i) => (
              <button
                key={contract}
                type="button"
                className={`${ui.button} ${styles.contract}`}
                aria-label={fr.bid[contract]}
                disabled={!template.choices.includes(contract)}
                onClick={() => bid(contract)}
              >
                <BidIcon cards={i + 1} />
                <span>{fr.bid[contract]}</span>
                <span className={styles.multiplier}>
                  {fr.panels.multiplier(CONTRACT_RULES[contract].multiplier)}
                </span>
              </button>
            ))}
          </div>
          {/* Apart, below every contract, and drawn differently: never mistaken for one. */}
          <button type="button" className={styles.pass} onClick={() => bid('pass')}>
            {fr.bid.pass}
          </button>
        </section>
      );
    }
    case 'callKing':
      return (
        <section className={styles.panel} aria-label={fr.panels.callKing}>
          <p className={styles.title}>{fr.panels.callKing}</p>
          <div className={ui.row}>
            {template.cards.map((card) => (
              <button
                key={card}
                type="button"
                className={ui.button}
                onClick={() => send({ type: 'action', action: { type: 'callKing', card } })}
              >
                {cardName(card)}
              </button>
            ))}
          </div>
        </section>
      );
    case 'ecart': {
      const status = ecartStatus(template, ecart);
      return (
        <section className={styles.panel} aria-label={fr.panels.ecart(template.count)}>
          <p className={styles.title}>{fr.panels.ecart(template.count)}</p>
          {status.missing !== 0 && (
            <p className={styles.hint}>{fr.panels.ecartMissing(status.missing)}</p>
          )}
          {status.trumpsTooSoon && <p className={styles.warning}>{fr.panels.ecartTrumps}</p>}
          <button
            type="button"
            className={`${ui.button} ${ui.primary}`}
            disabled={!status.ready}
            onClick={() => send({ type: 'action', action: { type: 'ecart', cards: [...ecart] } })}
          >
            {fr.panels.confirmEcart}
          </button>
        </section>
      );
    }
    case 'decideChelem':
      return (
        <section className={styles.panel} aria-label={fr.panels.chelem}>
          <p className={styles.title}>{fr.panels.chelem}</p>
          <div className={ui.row}>
            <button
              type="button"
              className={ui.button}
              onClick={() =>
                send({ type: 'action', action: { type: 'decideChelem', announce: false } })
              }
            >
              {fr.panels.noAnnounce}
            </button>
            <button
              type="button"
              className={ui.button}
              onClick={() =>
                send({ type: 'action', action: { type: 'decideChelem', announce: true } })
              }
            >
              {fr.panels.announce}
            </button>
          </div>
        </section>
      );
    case 'playCard':
      // Without a poignée to offer, a short line is enough: the lit cards say the rest.
      if (!template.poignee) return <p className={styles.prompt}>{fr.panels.play}</p>;
      return (
        <section className={styles.panel} aria-label={fr.panels.play}>
          <p className={styles.title}>{fr.panels.play}</p>
          <PoigneeChooser
            template={template.poignee}
            poignee={poignee}
            onChange={onPoigneeChange}
          />
        </section>
      );
  }
}

function PoigneeChooser({
  template,
  poignee,
  onChange,
}: {
  template: PoigneeTemplate;
  poignee: readonly Card[] | null;
  onChange: (cards: readonly Card[] | null) => void;
}) {
  const status = poignee ? poigneeStatus(template, poignee) : null;
  const pickLevel = (level: PoigneeLevel) => onChange(defaultPoignee(template, level));
  const toggle = (card: Card) =>
    poignee &&
    onChange(poignee.includes(card) ? poignee.filter((c) => c !== card) : [...poignee, card]);
  const sizes = template.levels.map((l) => l.size);
  return (
    <>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={poignee !== null}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? defaultPoignee(template, template.levels[0]?.level ?? 'simple')
                : null,
            )
          }
        />
        {fr.panels.declarePoignee}
      </label>
      {poignee && (
        <>
          <div className={ui.row} role="radiogroup" aria-label={fr.panels.declarePoignee}>
            {template.levels.map(({ level, size }) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={status?.level === level}
                className={`${ui.button} ${status?.level === level ? styles.levelOn : ''}`}
                onClick={() => pickLevel(level)}
              >
                {fr.poigneeLevel[level]} ({size})
              </button>
            ))}
          </div>
          <p className={styles.hint}>{fr.panels.poigneeHint}</p>
          <div className={styles.chips} role="group" aria-label={fr.panels.poigneeCards}>
            {template.eligible.map((card) => (
              <button
                key={card}
                type="button"
                aria-pressed={poignee.includes(card)}
                aria-label={cardName(card)}
                // A trump shown again from the écart (FFT p. 6).
                aria-description={template.fromEcart.includes(card) ? fr.panels.inEcart : undefined}
                className={`${styles.chip} ${poignee.includes(card) ? styles.chipOn : ''} ${template.fromEcart.includes(card) ? styles.fromEcart : ''}`}
                onClick={() => toggle(card)}
              >
                <CardFace card={card} />
              </button>
            ))}
          </div>
          {status?.excuseNotAllowed && <p className={styles.warning}>{fr.panels.poigneeExcuse}</p>}
          {status && status.level === null && !status.excuseNotAllowed && (
            <p className={styles.warning}>{fr.panels.poigneeInvalid(sizes)}</p>
          )}
        </>
      )}
    </>
  );
}
