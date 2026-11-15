import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from './index';

describe('engine', () => {
  it('is wired into the test runner', () => {
    expect(ENGINE_VERSION).toBe('0.0.0');
  });
});
