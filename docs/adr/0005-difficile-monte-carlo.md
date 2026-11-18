# Difficile plays cards by Monte-Carlo determinisation, with Moyen as its playout policy

Difficile keeps Moyen's bidding, king call, écart and poignée, and only chooses its cards differently. For each card it may play, it draws guesses of the hidden cards that fit everything its seat knows: cards played, colours others lack, shown poignées and écart trumps, the revealed chien, and a known partner. In each guess it plays the card, has Moyen play the rest of the deal at every seat, and keeps the card with the best average final score for its seat. The same guesses judge every card. The number of guesses is fixed, so a seed always gives the same decision, and the deals played per decision are capped, so a decision stays well under the room server's 1 s target. A time budget was rejected: it varies with the machine, and tests could not reproduce its decisions.

Playing out a guess needs the whole history of the deal, which the redacted view does not hold (only the last trick). So the bot memory records every completed trick, and the room server rebuilds it from the public tricks for a bot standing in mid-deal. The engine builds a validated deal in play from that history and one guess (`createDealInPlay`), so the bots never assemble engine state by hand.

## Consequences

- In 5 players Difficile plays like Moyen until the partner is known. Each guess settles the partner differently, and choosing a card that is best in every such world lost about 12 points a deal against Moyen. Waiting turned that into a gain (benchmark, paired deals: +12 at 3 players, +22 at 4, +9 at 5).
- Guesses do not take the bidding into account (a taker is likely strong). That would be the next lever if Difficile needs to be stronger.
- The benchmark plays each deal twice on the same cards, once with Moyen in Difficile's seats, because the score of single deals is too noisy. It takes minutes and runs on demand (`pnpm --filter @tarot/bots bench`), not in the normal test suite.
