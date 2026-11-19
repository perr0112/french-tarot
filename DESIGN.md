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
- Gradients, glows, textures and heavy drop shadows (except the subtle card shadow token).
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

> **Table colour — validated:** a desaturated deep green felt (see §7).

| Token                | Value               | Use                                   |
| -------------------- | ------------------- | ------------------------------------- |
| `table`              | `#1F3A30`           | Table surface (felt)                  |
| `table-edge`         | `#18302A`           | Subtle vignette / seat areas          |
| `surface`            | `#FAFAF7`           | Panels, score sheet, menus            |
| `surface-muted`      | `#F1F0EB`           | Secondary surfaces                    |
| `ink`                | `#1C1C1A`           | Primary text on light surfaces        |
| `ink-muted`          | `#6B6A65`           | Secondary text                        |
| `ink-on-table`       | `#F4F2EA`           | Text placed on the table              |
| `ink-on-table-muted` | `#B9C2BC`           | Secondary text on the table           |
| `accent`             | `#E2B04A`           | Your turn, selected — the only accent |
| `suit-red`           | `#C23B32`           | ♥ ♦                                   |
| `suit-black`         | `#1C1C1A`           | ♠ ♣                                   |
| `card-face`          | `#FFFDF8`           | Card background                       |
| `card-back`          | `#2C4A6B`           | Card back pattern base                |
| `card-edge`          | `rgb(0 0 0 / 0.12)` | Card face outline (stroke over scans) |
| `positive`           | `#2F7A49`           | Positive score, contract made         |
| `negative`           | `#B5473D`           | Negative score, contract failed       |

Contrast: all text ≥ 4.5:1 against its background (≥ 3:1 for text ≥ 24 px).
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
- Elevation: `shadow-card` = `0 1px 2px rgb(0 0 0 / 0.18), 0 2px 6px rgb(0 0 0 / 0.12)`; `shadow-raised` (hovered/selected card) = `0 4px 12px rgb(0 0 0 / 0.22)`; `shadow-panel` = `0 8px 24px rgb(0 0 0 / 0.16)`. Nothing heavier.

### 3.4 Layout sizes

CSS variables: `--width-*`, `--card-*` (card values are widths; height follows the 5:8 ratio).

| Token           | Value                    | Use                                   |
| --------------- | ------------------------ | ------------------------------------- |
| `width-narrow`  | 420 px                   | Home, nickname form                   |
| `width-regular` | 560 px                   | Decision panels, score sheet drawer   |
| `width-wide`    | 720 px                   | Lobby, final ranking                  |
| `card-hand`     | `clamp(56px, 7vw, 84px)` | Cards in the player's hand            |
| `card-trick`    | `clamp(48px, 7vw, 80px)` | Cards in the current / previous trick |
| `card-mini`     | 32 px                    | Mini cards in the info bar strip      |
| `card-chip`     | 36 px                    | Poignée chooser chips                 |

- **Breakpoint**: one only, `compact` = 600 px (`@media (max-width: 600px)`). Media queries cannot read CSS variables, so the value is exported once as `breakpoints.compact` in `tokens.ts`; CSS repeats the literal 600px and nothing else.

### 3.5 Focus, selection, accent

- **Selection and turn** use the accent: selected card = `border-selected` accent outline; current seat = accent.
- **Keyboard focus never uses the accent**: `:focus-visible` draws a `border-thick` ring with `focus-offset`, in `ink-on-table` on the table and in `ink` inside light surfaces (`.panel` sets `--focus-ring-color`). A focused-and-selected card therefore shows both, distinctly.
- Native checkboxes / radios: `accent-color: accent` (checked = selected state).
- **`.primary` (gold) is reserved for the single main action of a screen or panel** ("Valider l'écart", "Lancer la partie", "Continuer"). Choice lists — bids, king call, chelem announce/decline — use the neutral `.button`. Never more than one `.primary` visible per panel.

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

## 4. Cards

- **Art**: scans of the Tarot nouveau B.P. Grimaud (1898), public domain (`apps/web/public/cards/SOURCES.md`), in `public/cards/<card id>.webp`, written by `apps/web/scripts/fetch-cards.py`. The scan is clipped to the card outline, its paper margin cut off.
- Ratio **100:177**, the scans' proportions.
- **Corner index** drawn over every scan, top-left only (the part visible in the fan), on a `card-face` cartouche: rank + suit pip; trump number + a small solid frame; the Petit, the 21 and the Excuse on a solid `ink` badge (the Excuse shows a star).
- **Mini cards** (32–40 px strips): drawn, not scanned — one large value and one mark.
- Playable vs. unplayable (AGENTS.md §6): unplayable cards are dimmed (opacity ~0.45) **and** not lifted on hover; playable cards lift slightly on hover.
- All card art lives in the repo, with its source; nothing is loaded from a third-party host.

## 5. Layout

- Local player at the bottom, hand as a fan; opponents around the table; current trick in the centre.
- Persistent but quiet info: contract + taker, dealer marker, called king (5p, once revealed), score summary.
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
