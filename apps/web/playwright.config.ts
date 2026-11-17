import { defineConfig, devices } from '@playwright/test';

/** End-to-end happy path (AGENTS.md §2 Testing): runs the web app and the room server locally. */
export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @tarot/party dev',
      port: 8787,
      reuseExistingServer: true,
      timeout: 60_000,
      cwd: '../..',
    },
    {
      command: 'pnpm --filter @tarot/web dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 60_000,
      cwd: '../..',
    },
  ],
});
