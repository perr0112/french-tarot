import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/web', 'apps/party'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts', 'apps/party/src/**/*.ts'],
      // The Durable Object adapter is a thin shell over the tested room core (milestone 4).
      exclude: ['**/*.test.ts', '**/testing/**', '**/index.ts', 'apps/party/src/server.ts'],
      reporter: ['text', 'html'],
      // The engine is the product (AGENTS.md §2): keep its coverage very high.
      thresholds: {
        'packages/engine/src/**': { statements: 98, branches: 95, functions: 100, lines: 98 },
      },
    },
  },
});
