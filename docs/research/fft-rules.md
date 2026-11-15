# FFT official rules: research notes

Research date: 2026-11-15.

## Source

**[FFT] Fédération Française de Tarot, "Chapitre 1 : Règlement officiel en donnes libres"**,
PDF hosted on the federation's site:
<https://fftarot.fr/assets/documents/ReglementFFT_DonnesLibres.pdf> (12 pages, marked "Rectificatif n°1";
its sample score sheet is dated 15 August 2008). I could not find a newer rulebook on fftarot.fr, so
treat this as the current official text. Page numbers below are PDF page numbers.

All findings come from this primary source. Secondary sources (pagat.com, regles2jeux.fr, club PDFs)
were only skimmed and are not relied on. Quotes are short excerpts in French. Everything else is
paraphrased.

---

## 1. Petit au bout

**Rule.** The Petit is "au bout" when it is in the last trick. The side that wins the last trick, if
that trick contains the Petit, gets a bonus of 10 points, "multipliable selon le contrat, quel que
soit le résultat de la donne" (p. 6, "Le petit au bout"). So the bonus is 10 × multiplier
(×1/×2/×4/×6), it goes to the side that won the last trick, and it applies whether the contract
is made or not.

**How it fits into the score.** The FFT computes `(25 + gain or loss) × multiplier` first, and
"Enfin" adds the poignée, petit au bout and chelem bonuses (p. 7–8, "Le calcul des scores").
The petit au bout bonus is therefore a separate signed term of 10 × multiplier, added after the
multiplication. It is positive for the side that took the Petit to the end and negative for the other side.

**Worked examples (p. 8, "Exemples de marque de points"):**

- Garde, poignée of 10, taker takes the Petit au bout, 49 pts with 2 bouts:
  (25 + 8) × 2 = 66, + 20 (poignée), + 10 × 2 = 20 (petit au bout) → +106 per defender; taker +318.
- Garde sans won by 4, but the defence takes the Petit au bout: (25 + 4) × 4 = 116, minus 40 → +76;
  taker +228.
- Prise failed by 7, poignée of 10 shown by the taker, taker takes the Petit au bout:
  25 + 7 + 20 − 10 = 42 → each defender +42, taker −126. The amount is computed from the
  **winning side's** point of view (the defence here). The taker's petit au bout is subtracted.
- p. 6 examples: on a garde sans, a defender takes the Petit au bout, so the taker side pays
  10 × 4 = 40 to each defender. If the taker still makes the contract, the bonus comes off the taker's gain.

**Discrepancy with AGENTS.md §3:** The bonus value, beneficiary and independence from the outcome
all match. The formula `(25 + |diff| + petitAuBout) × multiplier` gives the same numbers as the FFT
method only if `petitAuBout` is **±10, signed relative to the side that wins the contract** (the
side the "signed positive if made, negative if failed" sign applies to). In the FFT, petit au bout
is a separate term of 10 × multiplier added after the multiplication. Recommend writing the engine
in the FFT form, `S = (25 + |diff|) × mult ± 10 × mult ± poignée ± chelem`, with each term signed
from the taker's point of view, to avoid sign mistakes when the contract fails.

---

## 2. Chelem

**Who / when.** "Le chelem est demandé après l'annonce d'un contrat" (p. 5, "Le chelem"). The text
talks about "un joueur" who requests it, but the rest of the section only refers to the
preneur/déclarant: "le preneur doit obligatoirement faire tous les plis". Nothing describes a
defender announcing a chelem. In a tournament the player must call the arbiter. The text gives no
exact moment beyond "after a contract", but because the announcer leads, the announcement
necessarily comes before the first card. **Opening lead:** "l'entame revient de droit au joueur qui
l'a demandé, quel que soit le donneur" (p. 5).

**Bonuses (p. 5):** announced and made: +400. Not announced but made: +200. Announced but failed:
"200 points sont déduits du total".

**Defence chelem:** "il arrive que la défense inflige un chelem au déclarant". In that case each
defender gets a 200-point bonus on top of the normal score (p. 5). In 4 players, the taker therefore
pays 3 × 200 on top.

**Multiplied?** No. They are "primes" added after the multiplication ("Enfin, les éventuelles
primes … sont ajoutées", p. 8). Worked example (p. 8): garde, announced chelem made, poignée,
petit au bout, 87 pts with 2 bouts: (46 + 25) × 2 + 20 + 20 + 400 = 582. Taker +1746.

**Sign.** The chelem bonus belongs to the side that made the chelem (or, for the −200, is a penalty
on the side that announced it). It does not follow the contract outcome. The text does not
explicitly cover "announced chelem failed but contract made". The natural reading of "déduits du
total" is that the taker's total (gain or loss) is reduced by 200, which taken with p. 5's
"prime (ou une pénalité)" wording means the taker side always pays it.

**Discrepancy with AGENTS.md §3:**

- The +400 / +200 / −200 values match and are not multiplied.
- **Missing in AGENTS.md:** a chelem achieved by the defence gives **+200 per defender** (the taker
  pays). AGENTS.md has no defence-chelem case.
- **Ambiguity:** AGENTS.md adds `chelem` inside a total that is "signed positive if made, negative
  if failed". The chelem term must be signed **relative to the taker** (±400/±200 for the taker side,
  −200 penalty for the taker side, +200 per defender for a defence chelem), not flipped by the contract outcome.
- AGENTS.md says "the announcer leads the first trick", which matches. AGENTS.md does not say who may
  announce. The FFT text implies only the taker (the defence can only _inflict_ a chelem, not
  announce one).

---

## 3. Excuse in a chelem; Excuse on the last trick

**Chelem side holds the Excuse.** "S'il détient l'excuse, il la jouera en dernier. En conséquence,
le petit sera considéré au bout s'il est joué à l'avant-dernier pli" (p. 5). The Excuse "ne
permet pas de réaliser une levée (sauf en cas de chelem)" (p. 7), so in a chelem it wins the last trick.

**Chelem made by the taker side without the Excuse.** The Excuse, played normally, stays with the
defence and counts 4 points (pair counting) for them (p. 7). The chelem is still valid, and the p. 8
example (582) has the defence keeping the Excuse.

**Excuse on the last trick outside a chelem.** "l'excuse ne doit pas être jouée à la dernière levée,
sauf en cas de chelem, sinon elle change de camp" (p. 3). So it goes to the side that wins the last
trick. The text says "ne doit pas" (should not), but the consequence it states is that the Excuse
changes sides, not that the play is illegal.

**Discrepancy with AGENTS.md §3:** None on substance. Addition to note: in a chelem by the taker side
that does not hold the Excuse, the Excuse stays with the defence (4 points) and does not break the
chelem. "Must the chelem side play the Excuse last?" is phrased as "il la jouera en dernier". The
engine can treat the Excuse on the last trick as winning it when that side has won all previous
tricks. Whether playing it earlier is illegal is not stated. Recommend: allow it, but then it does
not win, and the Petit-au-bout-on-penultimate rule only applies when the Excuse is led or played to
the last trick.

---

## 4. Poignée

**Thresholds (4 players):** 10 / 13 / 15 trumps (p. 6). 3 players: 13 / 15 / 18 (p. 11).
5 players: 8 / 10 / 13 (p. 11).

**Bonuses:** 20 / 30 / 40. "Ces primes gardent la même valeur quel que soit le contrat. La prime
est acquise au camp vainqueur de la donne" (p. 6). They are not multiplied and go to the side that
wins the contract, whoever showed them. Examples (p. 6): if a defender shows 10 trumps and the taker
wins, each defender pays the taker 20.

**Timing:** optional ("s'il le désire"), announced and shown "juste avant de jouer sa première
carte" (p. 6). Trumps must be shown sorted.

**Exact count:** "La poignée doit comprendre effectivement DIX, TREIZE ou QUINZE atouts". A player
with 11, 12, 14 or 16 must hide one or more of their choice (p. 6). So the player shows **exactly**
the threshold count, never more. Showing fewer than a threshold is not a poignée.

**Excuse:** it may replace a missing trump, but showing it means the player has no other trump. It
may be placed anywhere in the poignée (p. 6). In practice the Excuse can only be shown when the player
shows **all** their trumps plus the Excuse to reach the threshold exactly (for example 9 trumps + Excuse).

**Who:** any player. The p. 6 example has a defender showing a poignée.

**Special case:** a taker with 4 Kings and 15 trumps who had to discard trumps must re-show the
discarded trump(s) with the triple poignée, which then counts (p. 6). The taker may also take the
écart back for the poignée before playing the first card (p. 5).

**Discrepancy with AGENTS.md §3:** None on thresholds, bonuses, multiplier or beneficiary.
AGENTS.md §3.6 does not state that **exactly** the threshold number must be shown (extras hidden),
and does not state the "Excuse only if no other trump left" rule precisely. Its wording ("showing it
means the player holds no further trump") matches. Add the exact-count rule to the engine's
legal-declaration check.

---

## 5. Excuse exchange when the owner's side has no trick yet

**Rule.** The player of the Excuse takes it back into their side's tricks and gives a low card (no
value: a low suit card or trump) to the side that won the trick. "Si le camp du joueur n'a pas encore
remporté de pli, il met l'excuse en évidence et donnera une carte à l'autre camp dès qu'il en aura
l'occasion" (p. 7). So the exchange is deferred until the owner's side wins a trick.

The text does not cover the case where that side **never** wins a trick (the Excuse stays with
its side but there is nothing to give). Combined with the chelem rule, the Excuse stays with the
defence and counts 4 points (p. 7).

**Discrepancy with AGENTS.md §3:** AGENTS.md does not cover the deferred exchange. The engine
should keep an "owed half-point card" debt, settled at the first trick won by the owner's side.
If it is never settled, the Excuse stays with its owner's side (4.5 points, or 4 by pair counting)
and nothing is given.

---

## 6. Petit sec

**Rule.** A player with the Petit sec ("c'est son seul atout et il n'a pas l'excuse") **must**
announce it, show their hand and cancel the deal before the bidding. The dealer's right-hand
neighbour (the next dealer, counter-clockwise) redeals. If an unannounced Petit sec is discovered
during play, the deal is cancelled and passes to the next dealer (p. 4, "La tenue des cartes").

**Discrepancy with AGENTS.md §3:** The definition and "redeal by the next dealer" match. The FFT
makes it **mandatory**. AGENTS.md §5 makes it a room option (default on). With the option "off" the
game is a house-rule variant, not FFT. That is acceptable since it is listed in §5, but it should be
labelled as such. Also, the announcement happens **before the bidding**, so the engine should check
for it at the end of dealing.

---

## 7. Dealing (4 players)

**Rule.** The dealer deals "trois par trois, dans le sens contraire des aiguilles d'une montre".
During the deal they build a 6-card chien "carte par carte". "Il est interdit de mettre la première
ou la dernière carte du paquet au chien". 18 cards each (p. 3). Before the deal, the player
opposite the dealer shuffles and the dealer's left-hand neighbour cuts, taking or leaving more than
3 cards (p. 3). Players deal in turn following the direction of play. A misdeal is redealt by
**the same** dealer (p. 3–4).

**Other variants:** in 3 players the cards are dealt **4 by 4** (chien still 6, 24 each, p. 11).
In 5 players they are dealt 3 by 3 (chien 3, 15 each, p. 11).

**Discrepancy with AGENTS.md §3:** 4 players: none. **3 players: AGENTS.md §3.2 says "3 at a time"
for all variants. The FFT says 4 by 4 for 3 players.** A cut of more than 3 cards and redeal by the
same dealer after a misdeal are not in AGENTS.md. A misdeal cannot happen in software, so it does
not matter in practice.

---

## 8. Score distribution (4 players)

**Rule.** "chaque défenseur marque un même nombre de points … Le preneur marque trois fois ce
total". The four scores sum to 0 (p. 8, "La marque en donnes libres"). So the taker gets ±3S and
each defender ∓S.

**Discrepancy with AGENTS.md §3:** None. 3 players: taker ×2 (p. 11), which matches. 5 players:
the attacking side's total is split 2/3 to the taker and 1/3 to the partner, which equals taker
±2S, partner ±S and defenders ∓S. Taker alone takes all of it (±4S) (p. 12). This matches.

---

## Other discrepancies found along the way (outside the 8 points)

- **Half-point rounding (3 and 5 players), p. 11–12.** When the taker's total is not a whole number,
  the ½ point goes to the winning side, after the side holding the Excuse has given its card.
  Examples: 40.5 with 2 bouts counts as 40 (fails by 1), and 41.5 counts as 42 (made by 1).
  AGENTS.md has no rounding rule. This matters because the engine stores half-points (×2). In
  4 players the taker's card count is always even, so totals are whole numbers.
- **5 players, opening lead restriction (p. 11).** The first lead may not be in the called King's
  suit unless it is the called King itself. This is missing from AGENTS.md §3.5/§3.7.
- **5 players, call cascade (p. 11).** Dame if holding 4 Kings, Cavalier if 4 Kings + 4 Dames, Valet
  if 4 "grands mariages". This matches AGENTS.md's "etc.". The FFT notes that 5-player tournaments are not
  certified but "Un règlement FFT existe".
- **Bidding (p. 4).** The dealer's right-hand neighbour speaks first and each player speaks once.
  If all pass, the dealer's right-hand neighbour redeals. This matches AGENTS.md.
- **Garde sans: a bout in the chien counts for the taker** for the points-needed threshold (p. 7).
  By symmetry, in a garde contre the chien's bouts go to the defence. AGENTS.md §3.8 says
  "+ écart/chien when applicable", which is consistent.
- **Écart (p. 5).** No Kings or bouts. Trumps only if unavoidable, and shown to the defence. This matches.
- **Trick play (p. 7).** When trump is led, a player must go higher than the highest trump played,
  even a partner's. This matches AGENTS.md. If the Excuse is led, the next card sets the suit. This
  is not explicit in AGENTS.md and should be added.
