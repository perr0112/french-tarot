import { ALL_CARDS } from '@tarot/engine';
import { CardBack, CardFace } from '../components/Card';
import { CardStrip } from '../components/CardStrip';
import { Hand } from '../components/Hand';
import { fr } from '../strings/fr';
import styles from './ContactSheet.module.css';

/** Every card and the back, full size and in a fan, to review card art (development only). */
export function ContactSheet() {
  const suits = ['S', 'H', 'D', 'C'].map((s) => ALL_CARDS.filter((c) => c.startsWith(s)));
  const trumps = ALL_CARDS.filter((c) => c.startsWith('T') || c === 'EXC');
  return (
    <main className={styles.sheet}>
      <h1 className={styles.title}>{fr.dev.cards}</h1>
      <h2 className={styles.heading}>{fr.dev.fullSize}</h2>
      {[...suits, trumps].map((cards) => (
        <div key={cards[0]} className={styles.row}>
          {cards.map((card) => (
            <div key={card} className={styles.full}>
              <CardFace card={card} />
            </div>
          ))}
        </div>
      ))}
      <div className={styles.row}>
        <figure className={styles.full}>
          <CardBack />
          <figcaption>{fr.dev.back}</figcaption>
        </figure>
      </div>
      <h2 className={styles.heading}>{fr.dev.fanSize}</h2>
      {[...suits, trumps].map((cards) => (
        <Hand key={cards[0]} cards={cards} active={null} />
      ))}
      <h2 className={styles.heading}>{fr.dev.miniSize}</h2>
      {[...suits, trumps].map((cards) => (
        <CardStrip key={cards[0]} label={fr.dev.miniSize} cards={cards} />
      ))}
      <CardStrip label={fr.dev.back} hidden={6} />
    </main>
  );
}
