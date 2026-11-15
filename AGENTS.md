# AGENT.md — French Tarot Web App

This file is the single source of truth for any agent (human or AI) working on this repository.
Read it fully before writing code. If something here conflicts with a request, ask before deviating.

---

## 1. Product summary

A desktop-first web app to play **French Tarot** following the **official FFT rules**
(Fédération Française de Tarot), in **3, 4 or 5 players**, online, with **mixed tables of humans and bots**.

- Players join with a **nickname + room link/code** — no accounts, no sign-up.
- Any empty seat can be filled by a **bot** (3 difficulty levels).
- A game is a **session of N deals** with a cumulative score sheet.
- **UI language: French only.** Code, comments, commits and docs: English.
- Card art: **original SVG cards** drawn for this project (no third-party card art).

### Non-goals (for now)
- User accounts, authentication, rankings, long-term history, replays.
- Mobile-first / PWA (the app must remain *usable* on mobile, but desktop is the target).
- Internationalisation (keep strings centralised so i18n can be added later, but ship French only).
- House rules beyond the room options listed in §5.

---

## 2. Architecture

```
french-tarot/
├─ packages/
│  ├─ engine/      # Pure TS rules engine — no I/O, no DOM, no network, no randomness except injected RNG
│  ├─ bots/        # Bot strategies (easy / medium / hard), depend only on engine
│  └─ protocol/    # Shared message types + zod schemas (client <-> server)
├─ apps/
│  ├─ web/         # React + TypeScript + Vite, deployed on Vercel
│  └─ party/       # PartyKit / Cloudflare Durable Objects room server (authoritative)
└─ AGENT.md
```

- **Monorepo** with pnpm workspaces. TypeScript `strict` everywhere.
- **Frontend**: React + TypeScript + Vite, static build deployed on **Vercel**.
- **Realtime / game server**: **PartyKit** (Cloudflare Durable Objects). **One room = one table.**
  Vercel serverless functions must NOT be used for game state (no persistent WebSockets there).
- **The server is authoritative.** Clients send *intents* (bid, discard, play card, declare…);
  the room validates them with the engine, applies them, and broadcasts **per-player redacted views**.
- **Hidden information never leaves the server**: a client only ever receives its own hand, public
  table state, and what the rules reveal (chien in petite/garde, shown poignée, called king when played,
  écart trumps that had to be shown). Never send the full state and "hide it in the UI".
- **Bots run inside the room server**, using the same redacted view a human at that seat would get
  (bots must not cheat by reading other hands).
- Room state is persisted in Durable Object storage after each action so a room survives eviction
  and players can reconnect.

### Engine design rules
- Pure, deterministic functions: `applyAction(state, action) -> state | error`.
- Explicit **state machine** of phases: `lobby → dealing → bidding → (kingCall) → chien/écart → declarations → playing → scoring → nextDeal | sessionEnd`.
- Randomness (shuffle/cut) comes from an **injected seeded RNG** so deals are reproducible in tests.
- `getLegalActions(state, seat)` is the single source of truth for what a player may do
  (used by the UI for highlighting, by bots, and by the server for validation).
- `getPlayerView(state, seat)` produces the redacted view.
- Variant differences (3/4/5 players) live in a **variant config object**, not in scattered `if`s.

### Testing
- **Vitest** for unit tests. The engine must have very high coverage — it *is* the product.
- **Property-based tests** (fast-check): random legal games always terminate, cards are conserved
  (78 total, 91 points total), scores of a deal always sum to zero.
- Golden tests for scoring with hand-computed examples (including poignées, petit au bout, chelem).
- Bot tests: a bot never proposes an illegal action; full bot-only games run to completion.
- Playwright e2e for a happy path (create room, fill with bots, play a deal) once the UI exists.

---

## 3. Game rules (FFT official) — reference for the engine

When in doubt, the **FFT official rulebook** wins over this summary. Flag any discrepancy you find.

### 3.1 Cards
- 78 cards: 4 suits (♠ ♥ ♦ ♣) × 14 cards (1–10, Valet, Cavalier, Dame, Roi), 21 trumps (atouts 1–21), and the **Excuse**.
- **Oudlers (bouts)**: the 1 of trump (**Petit**), the 21 of trump, and the **Excuse**.
- Card values:
  | Card | Points |
  |---|---|
  | Oudler (Petit, 21, Excuse) | 4.5 |
  | Roi | 4.5 |
  | Dame | 3.5 |
  | Cavalier | 2.5 |
  | Valet | 1.5 |
  | Any other card | 0.5 |
  Total = **91** points.
- Counting is usually done by pairs; the engine should just use half-points (store as integers ×2 internally to avoid float issues).

### 3.2 Seating, dealing
- Play, dealing and bidding go **counter-clockwise**. The dealer rotates counter-clockwise each deal.
- Cards are dealt **3 at a time**; chien cards are put aside **one at a time**, never the first or last card of the deck.
- Variant table:
  | Players | Cards each | Chien |
  |---|---|---|
  | 3 | 24 | 6 |
  | 4 | 18 | 6 |
  | 5 | 15 | 3 |
- **Petit sec**: a player whose only trump is the Petit (and who does not hold the Excuse) must announce it; the deal is cancelled and redealt (by the next dealer). Configurable, see §5.

### 3.3 Bidding
- Starting with the player after the dealer, each player speaks **once**: pass, or bid higher than the current bid.
- Contracts (ascending), with multiplier:
  | Contract | Multiplier | Chien |
  |---|---|---|
  | Petite | ×1 | revealed, taken by the taker, who then discards (écart) |
  | Garde | ×2 | revealed, taken by the taker, who then discards (écart) |
  | Garde sans (le chien) | ×4 | not revealed, counts for the **taker** at the end |
  | Garde contre (le chien) | ×6 | not revealed, counts for the **defence** at the end |
- If everyone passes, the deal is cancelled and the next dealer redeals.

### 3.4 Écart (Petite / Garde)
- The chien is shown to all, the taker adds it to their hand and discards the same number of cards face down.
- The écart may **never contain Kings or oudlers**.
- Trumps may be discarded **only if unavoidable**, and any discarded trump must be **shown** to everyone.
- The écart counts for the taker.

### 3.5 5-player specifics — calling a King
- Before the chien is revealed, the taker **calls a King** (any suit). The holder of that King is the taker's secret partner.
- If the taker holds all four Kings, they call a **Dame**; if they also hold all four Dames, a **Cavalier**, etc.
- The taker may call a King they hold themselves (or that is in the chien) → they play **alone** against four.
- The partner is revealed only when the called card is played. The UI must not leak it before.

### 3.6 Declarations (before playing the first card)
- **Poignée** (showing trumps), declared when playing one's first card. The Excuse may stand in for a trump, but showing it means the player holds no further trump.
  | Players | Simple | Double | Triple |
  |---|---|---|---|
  | 3 | 13 | 15 | 18 |
  | 4 | 10 | 13 | 15 |
  | 5 | 8 | 10 | 13 |
  | Bonus | 20 | 30 | 40 |
  The bonus is **not multiplied** and goes to the side that **wins the contract**, whoever declared it.
- **Chelem** (slam) announcement: made before the first card; the announcer leads the first trick.

### 3.7 Trick play
- The player after the dealer leads the first trick (except when a chelem was announced). The winner of a trick leads the next.
- **Must follow suit** if possible.
- If unable to follow suit: **must trump**; if trumps were already played in the trick, **must over-trump** if possible (otherwise must still trump lower — "pisser").
- When **trump is led**: must play a **higher** trump if possible, otherwise any trump.
- If unable to follow suit and holding no trump: play any card.
- **Excuse**: may be played at any time, exempts the player from following; it never wins the trick (except the chelem case). Its owner keeps it (it goes to their side's tricks) and gives in exchange a 0.5-point card from their tricks to the trick winner's side.
  - If the Excuse is played on the **last trick**, it goes to the side that wins that trick (except in a chelem, see below).

### 3.8 Scoring a deal
- Points needed by the taker depend on the number of oudlers in the taker's tricks (+ écart/chien when applicable):
  | Oudlers | Points needed |
  |---|---|
  | 3 | 36 |
  | 2 | 41 |
  | 1 | 51 |
  | 0 | 56 |
- Contract is made if `points >= needed`.
- **Base score** = `(25 + |points − needed| + petitAuBout) × multiplier + poignée + chelem`, signed positive if made, negative if failed.
- **Petit au bout**: the Petit won in the last trick → `10 × multiplier` for the side that won that trick, **regardless of contract outcome** (it is added with the sign of the side that achieved it).
- **Chelem** (all tricks won by one side):
  | Case | Bonus |
  |---|---|
  | Announced and made | +400 |
  | Not announced but made | +200 |
  | Announced and failed | −200 |
  Excuse in a chelem: if the chelem side holds the Excuse, it is played on the last trick and wins it; the Petit then counts "au bout" if played on the second-to-last trick.
- **Distribution (zero-sum)**, where `S` is the base score:
  | Players | Taker | Partner | Each defender |
  |---|---|---|---|
  | 3 | ±2S | — | ∓S |
  | 4 | ±3S | — | ∓S |
  | 5 (with partner) | ±2S | ±S | ∓S |
  | 5 (taker alone) | ±4S | — | ∓S |
- The score sheet must be able to display the **full breakdown** of each deal (points, needed, difference, multiplier, petit au bout, poignée, chelem, per-player result).

---

## 4. Bots

Three levels, all strictly using the redacted player view and `getLegalActions`:

| Level | Bidding | Écart | Card play |
|---|---|---|---|
| **Facile** | Simple threshold on hand strength | Random legal | Random legal card |
| **Moyen** | Heuristic hand evaluation (oudlers, trumps, kings, long suits) | Heuristic (cut suits, keep kings) | Heuristics: protect the Petit, play the Excuse wisely, give points to partner, avoid giving points to opponents |
| **Difficile** | Same as Moyen, tuned | Same as Moyen, tuned | Card tracking + Monte-Carlo determinisation (sample hidden hands consistent with known info, simulate, choose best) within a time budget |

- Bots also handle: king call (5p), poignée declaration, chelem (only when near-certain).
- A bot decision must complete within a bounded time (target < 1 s on the room server); add a small artificial delay so humans can follow the play.
- Bot strategies must be swappable behind a common `Bot` interface.

---

## 5. Rooms, sessions and room options

- A host creates a room → gets a **shareable link + short code**. Others join with a nickname.
- The host chooses the **variant (3/4/5 players)** and fills empty seats with bots (level per seat), then starts.
- **Room options** (set by the host before start, defaults in bold):
  - Number of deals in the session: **8** (configurable).
  - Bot level per seat: **Moyen**.
  - Petit sec → redeal: **on**.
  - Chelem announcements enabled: **on**.
  - Delay between bot moves: **normal** (fast / normal / slow).
- **Session**: N deals with a cumulative score sheet; a final ranking screen at the end; option to start a new session in the same room.
- **Reconnection**: a session token is stored in `localStorage` per room; reconnecting restores the seat.
- **Disconnect → bot replacement**: when a human disconnects, a bot (room default level) plays their seat until they come back; the UI shows that seat as "remplacé par un bot".
- No turn timer (not requested). Do not add one without asking.

---

## 6. UI / UX

> Visual design (principles, tokens, card rules, motion) is defined in **`DESIGN.md`**. Read it before any UI work.
> Design agents in `.claude/agents/`: `design-system`, `card-artist`, `motion`, `design-reviewer` (run it after every UI change).

- **Desktop-first** layout: table view with the local player at the bottom, opponents around, hand displayed as a fan.
  Must remain usable on a mobile screen, but no mobile-specific design effort for now.
- **Original SVG cards**: numbered and visually distinct trumps (1–21), stylised court cards, a clear Excuse. All art lives in the repo; no copied card designs.
- **Game aids** (always on):
  - Playable cards are highlighted; unplayable cards are dimmed and not clickable.
  - Previous trick can be reviewed.
  - Score breakdown is explained after each deal (see §3.8).
- **Declarations are proposed at the right moment**: when a poignée is possible, the UI offers to declare it and lets the player pick which trumps to show (Excuse handling per §3.6). Same for chelem announcement before the first card.
- Clear indications of: dealer, current speaker/player, contract and taker, called king (5p, once revealed), shown poignées, chien (when revealed).
- Animations for dealing/playing/collecting tricks should be smooth but short; never block input longer than necessary.
- All user-facing strings in **French**, centralised in one place (e.g. `apps/web/src/strings/fr.ts`).

---

## 7. Vocabulary (code ↔ French)

Code identifiers are in English. Use these mappings consistently:

| Code | French |
|---|---|
| `trump` | atout |
| `excuse` | Excuse |
| `oudler` | bout / oudler |
| `petit` | Petit (1 d'atout) |
| `dog` / `chien` | chien (prefer `chien` in code — it's well understood) |
| `discard` / `ecart` | écart (prefer `ecart`) |
| `taker` | preneur |
| `partner` | partenaire (5p, appelé) |
| `defence` / `defenders` | défense |
| `bid` / `contract` | enchère / contrat |
| `petite`, `garde`, `gardeSans`, `gardeContre` | Petite, Garde, Garde sans, Garde contre |
| `handful` / `poignee` | poignée (prefer `poignee`) |
| `slam` / `chelem` | chelem (prefer `chelem`) |
| `petitAuBout` | petit au bout |
| `deal` | donne |
| `trick` | pli |
| `king`, `queen`, `knight`, `jack` | Roi, Dame, Cavalier, Valet |

---

## 8. Conventions

- pnpm, TypeScript strict, ESLint + Prettier. No `any` in `engine` / `protocol`.
- Validate every incoming network message with zod (`packages/protocol`).
- Keep the engine free of framework dependencies so it can also run in the browser (e.g. future offline solo mode).
- Small, focused commits; conventional commit messages (`feat:`, `fix:`, `test:`, …).
- Do not add dependencies, features, or rule variants not described here without asking.

---

## 9. Suggested milestones

1. **Engine (4 players)**: cards, deal, bidding, écart, trick rules, scoring — fully tested.
2. **Engine 3 & 5 players**: variant config, king call, partner logic.
3. **Bots**: Facile, then Moyen; bot-only simulations.
4. **Room server** (PartyKit): rooms, seats, redacted views, reconnection, bot replacement.
5. **Web UI**: lobby, table, bidding, écart, declarations, trick play, score sheet.
6. **Bot Difficile** (Monte-Carlo).
7. **Polish**: SVG card set, animations, game aids, deployment (Vercel + PartyKit/Cloudflare).
