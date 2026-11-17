import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'party', environment: 'node' },
});
