import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '.agents/**'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['packages/engine/**/*.ts', 'packages/protocol/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['packages/engine/**/*.ts', 'packages/bots/**/*.ts'],
    rules: {
      // The engine and the bots are pure: randomness must be injected, never read from the platform.
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the injected RNG.' },
        { object: 'Date', property: 'now', message: 'The engine must stay deterministic.' },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
