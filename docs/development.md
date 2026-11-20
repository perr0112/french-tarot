# Development

Read [AGENTS.md](../AGENTS.md) first: it holds the architecture rules, the game rules and the conventions. This page is the practical side.

## Setup

- Node.js ≥ 22.12 (`.nvmrc` pins 24) and pnpm 9 (`packageManager` in `package.json`).
- `pnpm install` at the root installs every package of the workspace.

## Running locally

```bash
pnpm dev
```

starts the web app (Vite, <http://localhost:5173>) and the room server (`wrangler dev`, port 8787) together. The web app reaches the room server at `localhost:8787` unless `VITE_PARTY_HOST` says otherwise, and `apps/party/.dev.vars` lets any local port connect.

To play alone: create a table, add bots to the empty seats, and start. In development, `/dev/cartes` shows every card at every size (the contact sheet used to check the card art).

## Scripts

At the root:

| Command       | What it does                                                    |
| ------------- | --------------------------------------------------------------- |
| `pnpm dev`    | Web app and room server, with reload                            |
| `pnpm check`  | Type checks, lint, formatting, tests with coverage (as CI does) |
| `pnpm test`   | The unit tests once (`pnpm test:watch` to keep them running)    |
| `pnpm format` | Formats every file with Prettier                                |
| `pnpm build`  | Builds the web app into `apps/web/dist`                         |

In a package:

| Command                                        | What it does                                               |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `pnpm --filter @tarot/web test:e2e`            | Playwright: create a table, fill it with bots, play a deal |
| `pnpm --filter @tarot/bots bench`              | Difficile against Moyen on paired deals (takes minutes)    |
| `pnpm --filter @tarot/party run deploy:worker` | Deploys the room server ([deploy.md](deploy.md))           |

The first `test:e2e` needs Playwright's browser: `pnpm --filter @tarot/web exec playwright install chromium`.

## Tests

- **Engine** (`packages/engine`): unit tests for every rule, golden scoring tests computed by hand, and property-based tests (fast-check): random legal deals always end, the 78 cards and 91 points are kept, a deal's scores sum to zero. `@tarot/engine/testing` exports deals for other packages' tests.
- **Bots** (`packages/bots`): a bot never proposes an illegal action, and bot-only deals run to their end. The benchmark (`bench`) measures Difficile's gain over Moyen; `BENCH_DEALS` and `BENCH_SIMULATED_CARDS` change the number of deals and Difficile's budget.
- **Room server** (`apps/party`): a harness drives a room with a fake clock — joining, bots, reconnection, the pauses between moves.
- **Web app** (`apps/web`): components and screens with Testing Library, and one Playwright happy path.

## Card art

The 79 card images in `apps/web/public/cards/` come from Wikimedia Commons (the BnF's scans of the 1898 Grimaud deck). `apps/web/scripts/fetch-cards.py` downloads and converts them again if needed (it needs `python3` and `cwebp`). Sources and terms: [SOURCES.md](../apps/web/public/cards/SOURCES.md). Any other art must be public domain or freely licensed, with its source recorded next to it.

## Conventions

- Code, comments, commits and docs in English; the interface in French, every string in `apps/web/src/strings/fr.ts`.
- TypeScript strict, no `any` in the engine or protocol. ESLint and Prettier.
- Conventional commits (`feat:`, `fix:`, `test:`…), small and focused.
- Domain words as in [CONTEXT.md](../CONTEXT.md): `chien`, `ecart`, `poignee`, `chelem`, `taker`…
- UI work follows [DESIGN.md](../DESIGN.md).
