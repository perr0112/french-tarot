# Tarot

French Tarot in the browser, by the official rules of the Fédération Française de Tarot (FFT), for 3, 4 or 5 players. Play with friends and bots at the same table, with no account: pick a nickname, share the table's link, fill empty seats with bots, and play a session of deals with its score sheet.

**Play:** <https://french-tarot.vercel.app>. The interface is in French.

## Features

- **Official FFT rules**: bidding (petite, garde, garde sans, garde contre), chien and écart, calling a King at 5 players, poignées, chelem announcements, petit au bout, the Excuse, and the full scoring with a breakdown after every deal.
- **3, 4 or 5 players**, humans and bots mixed at one table.
- **Three bot levels**: Facile, Moyen (hand evaluation and card tracking), Difficile (Monte-Carlo simulations of the hidden hands).
- **Tables by link**: no sign-up. A player who loses the connection gets their seat back, and a bot plays it while they are away.
- **Fair play by design**: the server deals and checks every move, and each player only ever receives what they may see.
- **The real cards**: the 1898 Tarot nouveau by B.P. Grimaud, from the BnF's scans.

## Quick start

You need Node.js ≥ 22.12 (the repository pins 24 in `.nvmrc`) and pnpm 9.

```bash
pnpm install
pnpm dev
```

Then open <http://localhost:5173>. `pnpm dev` starts both the web app and the room server (on port 8787).

```bash
pnpm check
```

runs everything CI runs: type checks, lint, formatting and the tests with coverage. More in [docs/development.md](docs/development.md).

## How it is built

A pnpm monorepo in TypeScript:

| Package             | What it is                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `packages/engine`   | The rules: a pure, deterministic deal and session state machine, with no I/O. It is the most tested part. |
| `packages/bots`     | The three bot levels, playing from the same redacted view a human at that seat gets.                      |
| `packages/protocol` | Messages between the browser and the server, validated with zod.                                          |
| `apps/party`        | The room server: one Cloudflare Durable Object per table, authoritative, running the bots.                |
| `apps/web`          | The web app: React and Vite, deployed on Vercel.                                                          |

The browser sends intents (a bid, a card); the room checks them with the engine, applies them, saves the room, and sends each player their own view. Hidden cards never leave the server.

## Documentation

| Document                                                 | For                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| [AGENTS.md](AGENTS.md)                                   | The reference: product scope, architecture rules, the game rules, bots. |
| [CONTEXT.md](CONTEXT.md)                                 | The domain language (chien, écart, poignée…) used in code and docs.     |
| [DESIGN.md](DESIGN.md)                                   | Visual design: principles, tokens, cards, motion.                       |
| [docs/adr/](docs/adr/)                                   | Architecture decisions and why they were made.                          |
| [docs/research/fft-rules.md](docs/research/fft-rules.md) | The FFT rulebook, point by point, with page references.                 |
| [docs/development.md](docs/development.md)               | Working on the code: scripts, tests, benchmark, card art.               |
| [docs/deploy.md](docs/deploy.md)                         | Putting it online on Cloudflare and Vercel, on their free plans.        |

## Credits

**Cards**: _Tarot nouveau_, B.P. Grimaud, Paris, 1898, public domain. Scans by the Bibliothèque nationale de France — **Source gallica.bnf.fr / BnF** — downloaded from Wikimedia Commons. The BnF allows non-commercial reuse of these scans with that mention; commercial use needs a licence from the BnF. File by file sources: [apps/web/public/cards/SOURCES.md](apps/web/public/cards/SOURCES.md).

**Rules**: the official rules of the Fédération Française de Tarot.

**Font**: Inter, under the SIL Open Font License.
