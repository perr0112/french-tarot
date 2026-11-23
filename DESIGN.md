# DESIGN.md — French Tarot visual design

Single source of truth for how the app looks and moves. Every design agent reads this before working.
Only the `design-system` agent edits it, and only to record a decision (never to justify an exception).

Goal in one line: **clean, uncluttered, pleasant — the table and the cards are the interface; everything else gets out of the way.**

---

## 1. Principles

1. **Restraint.** If an element can be removed without losing information, remove it. No decoration for its own sake.
2. **The game first.** Cards, the current trick and "whose turn" are the visual priority. Chrome (menus, score, options) is quiet until needed.
3. **Hierarchy through type and space, not boxes.** Prefer whitespace and weight over borders, dividers and background panels.
4. **One accent colour.** It means "your action / current focus". Never use it decoratively.
5. **Calm motion.** Animations explain what happened (a card travelled, a trick was collected). They are short, interruptible, and never block input.
6. **Consistency beats novelty.** Reuse a token or component before inventing one.
7. **Legible at a glance.** Every game state from AGENTS.md §6 (dealer, current speaker, contract, taker, called king, poignées, chien) must be readable in under a second without hunting.

## 2. Forbidden

- Hard-coded colours, sizes, radii, shadows or durations in components — use tokens.
- Gradients, glows, textures and heavy drop shadows (except the subtle card shadow token, and the table and its mat: soft light, wood grain, weave, vignette, stitching and the mat's corner flourishes, from the `table-*`, `mat-*` and `ornament` tokens only).
- More than **2 font weights** in one view; more than **1 font family** for UI (cards may use their own numeral face).
- Animations longer than **300 ms** on the input path (playing a card, clicking a bid). Dealing may be longer but must be skippable.
- Animating layout properties (`width`, `height`, `top`, `left`) — animate `transform` and `opacity`.
- Colour as the only carrier of information (suits, playable state, teams): always pair it with shape, position or text.
- Modals for information that could be inline. A modal is for a decision the game is waiting on.
- Emoji or third-party icons. Card art: only the sourced scans of §4.

## 3. Tokens

Tokens live in code under `apps/web/src/design/tokens.ts` (and are exposed as CSS custom properties).
The values below are the reference; code must match them.

### 3.1 Colour

> **Table colour — validated:** a wooden table with a small brown mat under the cards (see §7; a green felt until 2026-11-23).

| Token                | Value                     | Use                                   |
| -------------------- | ------------------------- | ------------------------------------- |
| `table`              | `#2A1D16`                 | The wooden table (walnut)             |
| `table-edge`         | `#1C130E`                 | Its darker edges (vignette)           |
| `table-light`        | `rgb(255 236 214 / 0.06)` | Soft light on the table and the mat   |
| `table-grain`        | `rgb(0 0 0 / 0.12)`       | The wood's grain (two gratings)       |
| `table-figure`       | `rgb(0 0 0 / 0.04)`       | The wood's slow figure across it      |
| `mat`                | `#5E3D2B`                 | The small brown mat under the cards   |
| `mat-edge`           | `#4A2F21`                 | Its edge                              |
| `mat-weave`          | `rgb(0 0 0 / 0.04)`       | Its fine weave (4 px)                 |
| `mat-stitch`         | `rgb(244 226 200 / 0.35)` | Its stitched border                   |
| `ornament`           | `#C9A46A`                 | The mat's corner flourishes (brass)   |
| `surface`            | `#FAFAF7`                 | Panels, score sheet, menus            |
| `surface-muted`      | `#F1F0EB`                 | Secondary surfaces                    |
| `ink`                | `#1C1C1A`                 | Primary text on light surfaces        |
| `ink-muted`          | `#6B6A65`                 | Secondary text                        |
| `ink-on-table`       | `#F4F2EA`                 | Text placed on the table              |
| `ink-on-table-muted` | `#C8B8A8`                 | Secondary text on the table           |
| `accent`             | `#E2B04A`                 | Your turn, selected — the only accent |
| `suit-red`           | `#C23B32`                 | ♥ ♦                                   |
| `suit-black`         | `#1C1C1A`                 | ♠ ♣                                   |
| `card-face`          | `#FFFDF8`                 | Mini card background                  |
| `card-paper`         | `#E4E1D5`                 | Scans' paper: cartouches, trump bands |
| `card-edge`          | `rgb(0 0 0 / 0.12)`       | Card face outline (stroke over scans) |
| `positive`           | `#2F7A49`                 | Positive score, contract made         |
| `negative`           | `#B5473D`                 | Negative score, contract failed       |

Contrast: all text ≥ 4.5:1 against its background (≥ 3:1 for text ≥ 24 px). On the table: `ink-on-table` 14.6:1, `ink-on-table-muted` 8.5:1, `accent` 8.2:1; on the mat: 8.6:1, 5.0:1, 4.8:1.
`positive` is 5.02:1 on `surface` and 4.60:1 on `surface-muted`; `negative` is 5.11:1 and 4.68:1.

### 3.2 Typography

- UI font: **Inter** (variable), fallback `system-ui, sans-serif`. Numerals: `font-variant-numeric: tabular-nums` in scores.
- Weights: **400** (regular) and **600** (emphasis). Nothing else.

| Token     | Size / line-height | Use                             |
| --------- | ------------------ | ------------------------------- |
| `text-xs` | 12 / 16            | Captions, labels on seats       |
| `text-sm` | 14 / 20            | Secondary UI                    |
| `text-md` | 16 / 24            | Body, buttons                   |
| `text-lg` | 20 / 28            | Section titles, contract banner |
| `text-xl` | 28 / 34            | Screen titles, final ranking    |

### 3.3 Space, radius, elevation

- Spacing scale (px): `4, 8, 12, 16, 24, 32, 48, 64`. No other values.
- Radius: `radius-sm 6`, `radius-md 10`, `radius-lg 16`, `radius-card 8% / 4.5%` (cards only: scales with the card, 8% / 4.5% of its 100:177 box, i.e. 8 units of the 100×177 drawing; use it only on card-shaped boxes).
- Border widths: `border-thin 1px` (fields, card edge), `border-thick 2px` (turn indicator, frames, focus ring), `border-selected 3px` (selected card outline). `focus-offset 2px` (focus ring offset).
- Elevation: `shadow-card` = `0 1px 2px rgb(0 0 0 / 0.18), 0 2px 6px rgb(0 0 0 / 0.12)`; `shadow-raised` (hovered/selected card) = `0 4px 12px rgb(0 0 0 / 0.22)`; `shadow-panel` = `0 8px 24px rgb(0 0 0 / 0.16)`; `shadow-mat` = `0 6px 18px rgb(0 0 0 / 0.45)` (the mat lying on the table). Nothing heavier.

### 3.4 Layout sizes

CSS variables: `--width-*`, `--card-*` (card values are widths; height = width × `card-ratio`).

| Token                 | Value                              | Use                                                        |
| --------------------- | ---------------------------------- | ---------------------------------------------------------- |
| `width-narrow`        | 420 px                             | Home, nickname form                                        |
| `width-regular`       | 560 px                             | Decision panels, score sheet drawer                        |
| `width-wide`          | 720 px                             | Lobby, final ranking                                       |
| `card-ratio`          | 1.77                               | Card height / width (from geometry.ts)                     |
| `card-hand`           | `clamp(56px, min(7vw, 9vh), 84px)` | Cards in the player's hand                                 |
| `card-trick`          | `clamp(48px, min(7vw, 8vh), 80px)` | Cards in the current / previous trick                      |
| `card-spread-overlap` | 0.45                               | Share of a card hidden by the next in a spread (the chien) |
| `card-podium`         | `clamp(84px, 12vw, 128px)`         | The winner's card on the final podium                      |
| `card-podium-rest`    | `clamp(56px, 7vw, 84px)`           | The other players' cards on the final podium               |
| `card-mini`           | 32 px                              | Mini cards under a seat (poignée, écart trumps)            |
| `card-chip`           | 36 px                              | Poignée chooser chips                                      |

- **Breakpoint**: one only, `compact` = 600 px (`@media (max-width: 600px)`). Media queries cannot read CSS variables, so the value is exported once as `breakpoints.compact` in `tokens.ts`; CSS repeats the literal 600px and nothing else.

### 3.5 Focus, selection, accent

- **Selection and turn** use the accent: selected card = `border-selected` accent outline; current seat = accent.
- **Preselected card** (picked ahead of one's turn): raised like a selected card, with a **dashed** `border-selected` accent outline, as it is not played yet; focused, the focus ring goes around it.
- **Keyboard focus never uses the accent**: `:focus-visible` draws a `border-thick` ring with `focus-offset`, in `ink-on-table` on the table and in `ink` inside light surfaces (`.panel` sets `--focus-ring-color`). A focused-and-selected card therefore shows both, distinctly.
- Native checkboxes / radios: `accent-color: accent` (checked = selected state).
- **`.primary` (gold) is reserved for the single main action of a screen or panel** ("Valider l'écart", "Lancer la partie", "Continuer"). Choice lists — bids, king call, chelem announce/decline — use the neutral `.button`. **Bidding**: the four contracts always in the same places, rising left to right (2 × 2 at the compact breakpoint), each a tile with its drawn mark (a fan of one to four cards), its name and its multiplier; one already outbid stays, disabled. « Passer » is apart, alone on the last line, outlined and never filled, so it is never mistaken for a contract. Never more than one `.primary` visible per panel.

### 3.6 Motion

| Token              | Value                            | Use                                 |
| ------------------ | -------------------------------- | ----------------------------------- |
| `duration-instant` | 100 ms                           | Press feedback, hover               |
| `duration-fast`    | 180 ms                           | Card lift, small state changes      |
| `duration-base`    | 260 ms                           | Card played to centre, panel open   |
| `duration-slow`    | 400 ms                           | Trick collected (not on input path) |
| `ease-out`         | `cubic-bezier(0.22, 1, 0.36, 1)` | Things entering / arriving          |
| `ease-in-out`      | `cubic-bezier(0.65, 0, 0.35, 1)` | Things moving between two places    |
| `spring-card`      | stiffness 400, damping 32        | Interruptible card motion           |

- Respect `prefers-reduced-motion`: replace movement with opacity fades ≤ 150 ms.
- Bot move pacing (fast / normal / slow, AGENTS.md §5) is a game delay, not an animation duration.

**Table animations** (Web Animations API, `apps/web/src/motion/`; the view is always up to date, an animation only catches up and never delays input). Motion tokens: `motion-deal` 700 ms (a whole deal), `motion-from-seat` 0.5 (start scale of a card leaving a badge), `motion-collected` 0.4 (end scale of a collected card), `motion-turn-stagger` 40 ms (between two chien cards turning over).

| What                                   | Motion                                                                                                                                                                                                           | Token                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Card played by you                     | from the face you clicked (lifted) to its place in the trick                                                                                                                                                     | `duration-base`, `ease-out` |
| Card played by another seat            | from the seat's badge at `motion-from-seat`, growing to its place                                                                                                                                                | `duration-base`, `ease-out` |
| Trick collected (when the next is led) | the completed trick leaves at once towards the winner's badge, shrinking to `motion-collected`, faded out by mid-flight                                                                                          | `duration-slow`, `ease-out` |
| Last trick of a deal                   | its last card lands and the trick stays shown for the room's trick pause (`TRICK_PAUSE_MS`), then the deal result enters                                                                                         | —                           |
| Deal                                   | your cards fly in one by one from the dealer's badge, fading in over the first fifth of their flight, `motion-deal` in all; a click or key finishes it; not replayed when the page opens on a deal already dealt | `duration-base`, `ease-out` |
| Hand reflow                            | kept cards slide to their new place; cards joining (the chien, for the taker) fly in from where the chien lay, else fade in                                                                                      | `duration-fast`, `ease-out` |
| Chien turned over (petite, garde)      | for the other players, each card turns face up where it lies (`rotateY`), `motion-turn-stagger` apart; the room pauses `CHIEN_PAUSE_MS` before a bot taker discards                                              | `duration-fast`, `ease-out` |
| Chien taken or set aside               | it slides to the taker's badge like a collected trick (after the écart, or in a garde sans); in a garde contre it fades out where it lies; a cancelled deal's simply goes                                        | `duration-slow`, `ease-out` |
| Decision panel, deal result            | fade and rise of `space-2` (`.enter`); closing is instant                                                                                                                                                        | `duration-fast`, `ease-out` |
| Score sheet                            | slides in from the right (`.slideIn`)                                                                                                                                                                            | `duration-base`, `ease-out` |

Under `prefers-reduced-motion`, flights become `duration-instant` fades, the deal and the hand reflow (slides and the chien) are not animated, and panels only fade. Looking back at the last trick animates nothing; once the review ends, the next card and the collected trick move as usual.

## 4. Cards

- **Art**: scans of the Tarot nouveau B.P. Grimaud (1898), public domain (`apps/web/public/cards/SOURCES.md`), in `public/cards/<card id>.webp`, written by `apps/web/scripts/fetch-cards.py`. The scan is clipped to the card outline, its paper margin cut off.
- Ratio **100:177**, the scans' proportions (`card-ratio`, `radius-card` and the drawing are all derived from `geometry.ts`). The scan is drawn 2.5 units larger than the card on each side, so only its paper margin is cut off, never the art.
- **Corner index** drawn over every scan in `card-paper`, so it blends with the scan's paper:
  - suit cards: rank + suit pip top-left, on a cartouche that covers the scan's own top-left pip (all of it, never half);
  - trumps: the scan's printed number bands (top and bottom) are covered by paper bands closed by a thin `ink` rule; our number sits upright at the left of the top band and the right of the bottom one (never turned: a turned 9 reads 6). In the fan only our number shows, never a cut or printed one;
  - the Petit, the 21 and the Excuse: the index on a solid `ink` badge (the Excuse: a star, the badge alone).
- **Loading**: under a scan the face is `card-paper`; the scan fades in (`duration-fast`) once loaded. Every scan is preloaded when the app opens.
- **Mini cards** (32–40 px strips): drawn, not scanned — one large value and one mark.
- Playable vs. unplayable (AGENTS.md §6): unplayable cards (and the reviewed last trick, at `brightness(0.85)`) are darkened (`filter: brightness(0.6)`, not see-through, colours kept so the scans stay clean) **and** not lifted on hover; playable cards lift slightly on hover.
- All card art lives in the repo, with its source; nothing is loaded from a third-party host.

## 5. Layout

- Local player at the bottom, hand as a fan; opponents around the table; current trick in the centre.
- Persistent but quiet info: contract + taker and a chelem announced in the top bar, with the last trick and « Quitter la table » (it asks first during a session); dealer, taker and partner on the seats; the called King as a mini card under the taker's badge (« Appel », « Appel (seul) »).
- **Scores**: a light slip in the bottom row, to the right of the local player's decision and badge, above the hand (it takes no room from the seats or the trick, and does not move when a panel opens): folded, each total best first with the local player in bold; unfolded, the whole score sheet opens above the slip, over the felt. At the compact breakpoint, folded, only its button shows; unfolded, the sheet spans the bottom of the screen.
- A poignée shows under its seat for 5 s once declared, then fades out (`duration-base`; `duration-instant` under reduced motion); one declared before the page opened is not shown again. Écart trumps stay under the taker's badge.
- **Things lie where they are at a real table.** The chien lies in the centre: face down from the deal, turned face up for all in a petite or garde (the taker has it in hand, its cards marked by a short neutral rule until the écart is made). A poignée and the taker's shown écart trumps sit under that seat's badge. Between deals, each seat's score of the deal sits under its badge as a chip (`surface`, `positive` / `negative`); the centre holds the breakdown as a narrow slip of the score sheet.
- **Final screen**: on the felt, the ranking as cards — the 21 to the winner (larger, raised), then 20, 19… and the Excuse to the last place; equal totals share a rank and a card. Then the actions, the score sheet, and the last deal folded away.
- Whose turn: the accent colour on that seat, nothing else competing.
- Must remain usable at 375 px wide; no horizontal scroll.

## 6. Copy

- All user-facing strings in French, in `apps/web/src/strings/fr.ts`. Short, plain, no exclamation marks except for genuine events (chelem, petit au bout).

## 7. Decision log

Record design decisions here (date — decision — reason).

- 2026-11-13 — Initial DESIGN.md created.
- 2026-11-13 — Table colour validated: desaturated deep green felt (`table #1F3A30`), single gold accent (`#E2B04A`). Chosen over dark/light neutrals for a classic card-table feel kept calm by low saturation.
- 2026-11-18 — `positive` darkened `#3F8F5A` → `#2F7A49` (3.80:1 → 5.02:1 on `surface`, 4.60:1 on `surface-muted`); `negative` checked (5.11:1 / 4.68:1), unchanged. Reason: design review, contrast below 4.5:1.
- 2026-11-18 — Added `card-edge` colour token for the hard-coded card SVG stroke.
- 2026-11-18 — Added layout tokens: `width-narrow/regular/wide` (420/560/720; lobby 640 → `wide`, it holds the seat list and options), `card-hand/trick/mini/chip` (hand minimum raised 44 → 56 px for mobile legibility), `border-thin/thick/selected`, `focus-offset`, and the single `compact` 600 px breakpoint. Reason: hard-coded sizes found in components.
- 2026-11-18 — Focus ring no longer uses the accent (light / ink ring with offset) so it is distinct from selection; `accent-color` set for native inputs; `.primary` reserved for the one main action per panel, choice lists neutral. Reason: design review, focus and selection looked identical, accent overused.
- 2026-11-18 — `radius-card` changed from a fixed `8px` to `8% / 5%`, now also used by `Card.module.css`. Reason: the SVG card set is drawn in a 100×160 viewBox with an 8-unit corner; a proportional radius keeps clip, shadow, drawn edge and card buttons matching at every card size.
- 2026-11-19 — Card art switched from original SVG drawings to the Grimaud 1898 scans (user request: cards that look like real ones); ratio 5:8 → 100:177 and `radius-card` `8% / 5%` → `8% / 4.5%` to match the scans.
- 2026-11-19 — Review of the scans: `card-paper` token (cartouches, trump bands, face under a loading scan) replaces the now unused `card-back`; `card-ratio` token and `radius-card` derived from `geometry.ts`; dimmed cards `brightness(0.55) saturate(0.4)` → `brightness(0.6)` (the desaturation made the scans muddy).
- 2026-11-19 — Motion tokens `motion-deal`, `motion-from-seat`, `motion-collected` (table animations, §3.6).
- 2026-11-19 — Chien, poignées and écart trumps moved from the info bar to the table (centre, under the seats); deal scores under each seat; final screen as a card podium; `card-podium` token. Reason: user request — information was scattered with no link to the table or the players.
- 2026-11-19 — Review: `motion-turn-stagger` and `card-spread-overlap` tokens; chien cards get `shadow-card` so the backs can be counted; score colours `.positive` / `.negative` shared in `ui.module.css`; the deal slip's total in bold without a rule.
- 2026-11-20 — Scores moved from the top bar and drawer to a foldable slip in the felt's bottom-right corner; the called King moved under the taker's badge; poignées shown 5 s; a leave button. Reason: user request.
- 2026-11-20 — The table is exactly the screen's height (`100dvh`), never scrolled: the felt's empty space gives way to a growing panel, which scrolls inside only as a last resort; on a phone or below 600 px high the page scrolls instead, so nothing is hidden. The score sheet is as tall as the room above its slip. `card-hand` and `card-trick` also follow the height (`9vh`, `8vh`; the podium keeps width-only sizes, `card-podium-rest`), and the poignée panel is tighter (no title, box and levels on one line, one-line hint), so it clears the trick down to 768 px high. Reason: user report — declaring a poignée pushed the hand off screen.
- 2026-11-20 — Preselected card: dashed accent outline and `shadow-raised`, apart from the solid selection ring; its one-line notice under the decision keeps its height when empty, so nothing moves. Reason: user request (preselect a card ahead of one's turn).
- 2026-11-20 — Bid panel: contract tiles with drawn marks and multipliers in fixed places; « Passer » apart, outlined, last. Reason: user request — « Passer » was clicked by reflex at the bottom, where « Garde contre » had wrapped.
- 2026-11-20 — Scores coloured by sign everywhere: `positive` / `negative` text on light surfaces (score slip, score sheet totals and deal columns, « réussi » / « chuté »), and on the felt a chip on `surface` (deal scores under the seats, final podium totals); zero stays in ink. Reason: user request.
- 2026-11-23 — The green felt gives way to a wooden table (walnut `#2A1D16`, CSS grain and vignette, on every screen: `--felt` in global.css) with a small brown mat (`mat #5E3D2B`) in the centre where the cards are laid: stitched edge, soft shadow, and a brass flourish (`ornament #C9A46A`, 4.1:1 on the mat, never the accent) round a suit drawn in SVG at each corner, inside the stitching (Mat); no light on the mat, so its muted captions keep 5.0:1. §2 allows these gradients for the table and the mat only. The mat's size is fixed: a full trick (two cards high, five wide) and its caption, whatever lies there. Reason: user request — a small brown mat like a real one, and an artistic touch at the board's corners.
- 2026-11-23 — Between deals, the clicked « Continuer » becomes a neutral « Prêt » in the same place (`aria-disabled`, not `disabled`: it keeps the focus and its contrast). Bots are « Jade N », their number kept while they sit.
- 2026-11-24 — Reactions: « Réagir », a quiet button left of the local badge, opens six emoji on a `surface` row above it; a reaction pops (`duration-base`, none with reduced motion) in a `surface` bubble on the top right corner of the sender's badge for 3 s. Reason: user request — emoji reactions for a friendly table.
- 2026-11-24 — Final screen: « Rejouer » for every player, turning into a neutral « Prêt » with who is awaited under it, the same ReadyButton as « Continuer » between deals; « Retour au salon » for the host; while a seat is free, a muted line says why nobody can play again. Reason: user request — everyone accepts before a new session.
