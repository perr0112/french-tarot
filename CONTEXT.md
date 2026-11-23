# French Tarot

An online table for French Tarot played by the official FFT rules, in 3, 4 or 5 players, mixing humans and bots. This glossary is the shared language of the code, docs and conversations; code uses the English term, the UI the French one.

## Table and sessions

**Room**:
One online table, reached by a link or short code, with its seats and options.
_Avoid_: Game, lobby, table (for the online object)

**Participant**:
A person who joined a room with a nickname, seated or waiting for a seat; a private token lets them come back.
_Avoid_: User, player (for someone not seated), client

**Host** (hôte):
The participant who sets the room up and starts sessions: the first one still connected, in join order.
_Avoid_: Owner, admin

**Seat**:
A numbered place at the table, held by a human or a bot.
_Avoid_: Player slot, position

**Session**:
A series of N played deals at one room, with a cumulative score sheet and a final ranking.
_Avoid_: Game, match, partie (in code)

**Deal** (donne):
One hand of play, from shuffling to scoring, or to cancellation.
_Avoid_: Round, hand (for the whole deal)

**Dealer** (donneur):
The seat that deals this deal; the role moves to the next seat after each deal, played or cancelled.

**Cancelled deal**:
A deal stopped before play because everyone passed or a player had a petit sec; it is redealt by the next dealer and does not count toward the session's N deals.
_Avoid_: Void deal, misdeal

**Abandoned deal** (« Redonner »):
A deal in progress that a player alone with bots drops: the same dealer deals a new one, and the abandoned deal is recorded nowhere, unlike a cancelled deal.
_Avoid_: Redeal (the next dealer dealing after a cancelled deal)

**Variant**:
The player count (3, 4 or 5) and every rule parameter that depends on it.

## Cards

**Card**:
One of the 78 cards: 56 suit cards, 21 trumps and the Excuse.

**Trump** (atout):
A card numbered 1 to 21 that beats every suit card.
_Avoid_: Atout (in code)

**Petit**:
Trump number 1.

**Excuse**:
The card that excuses its owner from following suit, never wins a trick (except in a chelem) and stays with its owner's side.
_Avoid_: Fool

**Oudler** (bout):
One of the three cards that lower the points the taker needs: the Petit, the 21 and the Excuse.
_Avoid_: Bout (in code), honour

**Court card**:
A Valet, Cavalier, Dame or Roi.

**Hand** (main):
The cards a seat currently holds.

**Petit sec**:
A hand whose only trump is the Petit, with no Excuse; it cancels the deal.

## Bidding and contracts

**Bid** (enchère):
A seat's single turn to speak in the auction: pass or a contract higher than the current one.

**Contract** (contrat):
The winning bid: Petite, Garde, Garde sans or Garde contre, each with a multiplier.

**Multiplier**:
The factor a contract applies to the contract score and the petit au bout (1, 2, 4 or 6).

**Taker** (preneur):
The seat that won the bidding and must make the contract.
_Avoid_: Declarer, attacker

**Partner** (partenaire):
In 5 players, the holder of the called King, secretly on the taker's side.
_Avoid_: Ally, called player

**Taker's side**:
The taker, plus the partner in 5 players.
_Avoid_: Attack

**Defence** (défense):
Every seat not on the taker's side.
_Avoid_: Opponents (ambiguous from a defender's view)

**Called King**:
In 5 players, the card the taker names to choose a partner; usually a King, or a lower court card if the taker holds all four.

**Chien**:
The cards set aside face down during the deal (6 in 3 or 4 players, 3 in 5 players).
_Avoid_: Dog, kitty

**Écart** (ecart):
The cards the taker discards after taking the chien; they count for the taker.
_Avoid_: Discard (in code)

## Play

**Trick** (pli):
One card from each seat, won by the highest card of the led suit or the highest trump.

**Lead** (entame):
The first card of a trick, which sets the suit to follow (or the next card, if the Excuse is led).

**Last trick**:
The final trick of a deal; it decides the petit au bout.

**Poignée**:
A set of trumps a player shows with their first card, of exactly a threshold size, for a bonus.
_Avoid_: Handful (in code)

**Chelem**:
One side winning every trick of a deal, announced or not.
_Avoid_: Slam (in code), grand slam

**Chelem announcement**:
The taker's declaration, before the first card, that they will win every trick; they then lead the first trick.

**Petit au bout**:
The Petit played in the last trick, worth a bonus to the side that wins that trick.

**Excuse exchange**:
The Excuse's owner keeps it and gives a half-point card to the side that won the trick it was played in.

## Scoring

**Points** (in a deal):
The card points the taker's side collected, out of 91.
_Avoid_: Score (for card points)

**Points needed**:
The points the taker must reach, from 36 to 56 depending on the number of oudlers they hold at the end.

**Contract score**:
25 plus the gap between points and points needed, times the multiplier, positive if the contract is made.

**Deal score** (`S`):
The contract score plus petit au bout, poignée and chelem terms, all signed from the taker's side.

**Breakdown**:
The itemised result of a deal (points, needed, gap, multiplier, each bonus, each seat's result) shown on the score sheet.

**Score sheet** (feuille de marque):
The table of every deal's breakdown and the running totals of a session.

## Bots

**Bot**:
A program that plays a seat, deciding only from what a human at that seat could see.
_Avoid_: AI, robot (in code)

**Bot level** (niveau):
How strong a bot plays: Facile (`easy`), Moyen (`medium`), Difficile (`hard`).
_Avoid_: Difficulty, skill

**Bot memory**:
What a bot remembers of the current deal: every completed trick, the cards played and the colours each seat showed it lacks. It starts afresh with each deal; a bot standing in for a player mid-deal gets it from the tricks, which every seat saw.
_Avoid_: History, knowledge

**Sampled deal** (tirage):
One full distribution of the cards a seat cannot see, consistent with everything it knows, played out to judge a card.
_Avoid_: World, guess, determinisation (for the deal itself)

**Colour**:
A suit or the trumps, as far as following is concerned: what a seat must play into, or may lack.
_Avoid_: Suit (when trumps are included)

**Void** (coupe):
A seat known to hold no card of a colour because it did not follow.
_Avoid_: Short, cut (for the inference)

**Master card** (carte maîtresse):
A card that no unplayed card of its suit (or trump) can beat.
