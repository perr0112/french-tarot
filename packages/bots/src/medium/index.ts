import type { Action } from '@tarot/engine';
import { legalTemplate, type Bot } from '../bot';
import { remember } from '../memory';
import { poigneeToShow } from '../poignee';
import { chooseEcart } from './ecart';
import { contractWorth } from './evaluate';
import { chooseCalledCard } from './king-call';
import { chooseCard } from './play';

/** Moyen (AGENTS.md §4): heuristic bidding, écart and card play, with card tracking. */
export const mediumBot: Bot = {
  level: 'medium',
  decide(view, previous) {
    const memory = remember(previous, view);
    const template = legalTemplate(view);
    const decide = (): Action => {
      switch (template.type) {
        case 'bid': {
          const worth = contractWorth(view.hand, view.players);
          // Bid what the hand is worth if that still outbids; never more.
          return {
            type: 'bid',
            contract: worth !== null && template.choices.includes(worth) ? worth : 'pass',
          };
        }
        case 'callKing':
          return { type: 'callKing', card: chooseCalledCard(template.cards, view.hand) };
        case 'ecart':
          return { type: 'ecart', cards: chooseEcart(template, view.hand, view.calledCard) };
        case 'decideChelem':
          return { type: 'decideChelem', announce: false };
        case 'playCard': {
          const card = chooseCard(view, memory, template.cards);
          const poignee = poigneeToShow(template.poignee);
          return poignee ? { type: 'playCard', card, poignee } : { type: 'playCard', card };
        }
      }
    };
    return { action: decide(), memory };
  },
};
