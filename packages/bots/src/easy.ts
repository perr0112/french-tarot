import { isOudler, isTrump, variantFor, type Action, type PlayerView } from '@tarot/engine';
import { legalTemplate, pickOne, shuffled, type Bot } from './bot';
import { poigneeToShow } from './poignee';

/** Trumps plus oudlers counted twice, the Excuse included. */
function strength(view: PlayerView): number {
  const plainTrumps = view.hand.filter((c) => isTrump(c) && !isOudler(c)).length;
  return plainTrumps + 2 * view.hand.filter(isOudler).length;
}

/** Strength from which Facile takes a Petite, for 18 cards (4 players); scaled to the hand size. */
const PETITE_STRENGTH = 8;

/** Facile (AGENTS.md §4): a simple bidding threshold, otherwise random legal choices. */
export const easyBot: Bot = {
  level: 'easy',
  decide(view, memory, rng) {
    const template = legalTemplate(view);
    const decide = (): Action => {
      switch (template.type) {
        case 'bid': {
          const threshold = (PETITE_STRENGTH * variantFor(view.players).cardsPerPlayer) / 18;
          const take = strength(view) >= threshold && template.choices.includes('petite');
          return { type: 'bid', contract: take ? 'petite' : 'pass' };
        }
        case 'callKing':
          return { type: 'callKing', card: pickOne(template.cards, rng) };
        case 'ecart': {
          // Trumps only once every other eligible card is in (the engine's rule).
          const plain = shuffled(
            template.eligible.filter((c) => !isTrump(c)),
            rng,
          );
          const trumps = shuffled(template.eligible.filter(isTrump), rng);
          return { type: 'ecart', cards: [...plain, ...trumps].slice(0, template.count) };
        }
        case 'decideChelem':
          return { type: 'decideChelem', announce: false };
        case 'playCard': {
          const poignee = poigneeToShow(template.poignee);
          const card = pickOne(template.cards, rng);
          return poignee ? { type: 'playCard', card, poignee } : { type: 'playCard', card };
        }
      }
    };
    return { action: decide(), memory };
  },
};
