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
- Emoji or third-party icon/card art.

## 3. Tokens

Tokens live in code under `apps/web/src/design/tokens.ts` (and are exposed as CSS custom properties).
The values below are the reference; code must match them.

### 3.1 Colour

> **Table colour — validated:** a desaturated deep green felt (see §7).

| Token                | Value     | Use                                          |
| -------------------- | --------- | -------------------------------------------- |
| `table`              | `#1F3A30` | Table surface (felt)                         |
| `table-edge`         | `#18302A` | Subtle vignette / seat areas                 |
| `surface`            | `#FAFAF7` | Panels, score sheet, menus                   |
| `surface-muted`      | `#F1F0EB` | Secondary surfaces                           |
| `ink`                | `#1C1C1A` | Primary text on light surfaces               |
| `ink-muted`          | `#6B6A65` | Secondary text                               |
| `ink-on-table`       | `#F4F2EA` | Text placed on the table                     |
| `ink-on-table-muted` | `#B9C2BC` | Secondary text on the table                  |
| `accent`             | `#E2B04A` | Your turn, focus, selected — the only accent |
| `suit-red`           | `#C23B32` | ♥ ♦                                          |
| `suit-black`         | `#1C1C1A` | ♠ ♣                                          |
| `card-face`          | `#FFFDF8` | Card background                              |
| `card-back`          | `#2C4A6B` | Card back pattern base                       |
| `positive`           | `#3F8F5A` | Positive score, contract made                |
| `negative`           | `#B5473D` | Negative score, contract failed              |

Contrast: all text ≥ 4.5:1 against its background (≥ 3:1 for text ≥ 24 px).

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
- Radius: `radius-sm 6`, `radius-md 10`, `radius-lg 16`, `radius-card 8` (cards, proportional to card size).
- Elevation: `shadow-card` = `0 1px 2px rgb(0 0 0 / 0.18), 0 2px 6px rgb(0 0 0 / 0.12)`; `shadow-raised` (hovered/selected card) = `0 4px 12px rgb(0 0 0 / 0.22)`; `shadow-panel` = `0 8px 24px rgb(0 0 0 / 0.16)`. Nothing heavier.

### 3.4 Motion

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

- Ratio **5:8**. Corner index (rank + suit) top-left and bottom-right, readable when cards overlap in the fan.
- **Trumps**: the number is the hero — large, centred, unique per trump; a consistent trump frame distinguishes them from suit cards at a glance.
- **Excuse**: instantly recognisable, visually unlike any trump or suit card.
- **Court cards** (Valet, Cavalier, Dame, Roi): stylised, geometric, one consistent illustration language; the four suits stay distinguishable without colour.
- Playable vs. unplayable (AGENTS.md §6): unplayable cards are dimmed (opacity ~0.45) **and** not lifted on hover; playable cards lift slightly on hover.
- All card art is original and lives in the repo.

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
