# Deploying

Two parts go online separately (AGENTS.md §2):

- **Room server** (`apps/party`) on Cloudflare Workers, one Durable Object per table.
- **Web app** (`apps/web`), a static Vite build on Vercel.

The web app finds the room server through `VITE_PARTY_HOST`. The room server only accepts pages listed in `ALLOWED_ORIGINS`. Both are set once, below.

## 1. Room server on Cloudflare

You need a Cloudflare account; the free Workers plan includes SQLite-backed Durable Objects, and the bots are sized for its 10 ms of CPU per request (ADR-0005).

1. Sign in (opens your browser):

   ```bash
   pnpm --filter @tarot/party exec wrangler login
   ```

2. Deploy:

   ```bash
   pnpm --filter @tarot/party run deploy:worker
   ```

3. Note the address it prints, e.g. `https://french-tarot-party.<your-subdomain>.workers.dev`. Its host (without `https://`) is your `VITE_PARTY_HOST`.

Until step 3 of the Vercel part, `ALLOWED_ORIGINS` is empty and the server refuses every page: that is expected.

## 2. Web app on Vercel

1. In Vercel, **Add New → Project** and import the GitHub repository.
2. Set **Root Directory** to `apps/web`, and leave **Include files outside the root directory** on (the default): the app is built from `packages/` too. Vercel detects Vite and the pnpm workspace (`packageManager` in the root `package.json`).
3. Under **Environment Variables**, add `VITE_PARTY_HOST` = the host from step 1.3 (e.g. `french-tarot-party.<your-subdomain>.workers.dev`), for Production and Preview.
4. Deploy. Note the production address (e.g. `https://french-tarot.vercel.app`) and, from any preview deployment, the shape of preview addresses (e.g. `https://french-tarot-git-<branch>-<team>.vercel.app`).

`apps/web/vercel.json` sends every path to `index.html`, so a shared link such as `/salle/ABCDEF` opens the app.

## 3. Allow the web app to connect

1. In `apps/party/wrangler.jsonc`, set `ALLOWED_ORIGINS` to the production address and the preview pattern, comma-separated (pattern syntax: `isAllowedOrigin` in `apps/party/src/origin.ts`). End the preview pattern with your exact Vercel team slug, so that no other team's previews match:

   ```jsonc
   "vars": { "ALLOWED_ORIGINS": "https://french-tarot.vercel.app,https://french-tarot-*-<team>.vercel.app" },
   ```

2. Commit it and deploy the room server again (`pnpm --filter @tarot/party run deploy:worker`). The value lives in the repository: each deploy replaces whatever was set in the Cloudflare dashboard, so change it here, not there.
3. Open the production address, create a table, add bots and start a deal.

Local development is unaffected: `apps/party/.dev.vars` allows any port on `localhost` and `127.0.0.1`.

## Host code (optional)

The code that gives you an exceptional hand (AGENTS.md §5) is a Cloudflare secret, set once from your machine and never written in the repository:

```bash
pnpm --filter @tarot/party exec wrangler secret put HOST_CODE
```

Wrangler asks for the value. Pick something long nobody would guess (at most 200 characters, the most a page may send). To change it, run the same command again; to turn the code off, `wrangler secret delete HOST_CODE`. In a game, open the browser console and type `tarot("your code")`.

## Updating

- **Web app**: Vercel redeploys on every merge to `main`, and builds a preview for every pull request.
- **Room server**: redeploy by hand after merging changes to `apps/party`, `packages/engine`, `packages/bots` or `packages/protocol`:

  ```bash
  pnpm --filter @tarot/party run deploy:worker
  ```

  Rooms in progress survive a deploy: their state is stored in the Durable Object after each action.

- **Checks**: `.github/workflows/check.yml` runs `pnpm check` on every pull request and on `main`.

## Troubleshooting

| Symptom                                     | Likely cause                                                                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| The page stays on « Connexion à la table… » | `VITE_PARTY_HOST` missing or wrong in Vercel (redeploy the web app after changing it), or the page's address is not in `ALLOWED_ORIGINS` |
| A preview deployment cannot connect         | The preview pattern in `ALLOWED_ORIGINS` does not match its address                                                                      |
| `/salle/CODE` gives a 404                   | Vercel's Root Directory is not `apps/web`, so `vercel.json` is not used                                                                  |
