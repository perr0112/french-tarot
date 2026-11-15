import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/web'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/testing/**', '**/index.ts'],
      reporter: ['text', 'html'],
      // The engine is the product (AGENTS.md §2): keep its coverage very high.
      thresholds: {
        'packages/engine/src/**': { statements: 98, branches: 95, functions: 100, lines: 98 },
      },
    },
  },
});
