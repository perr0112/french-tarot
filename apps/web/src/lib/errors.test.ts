import { describe, expect, it } from 'vitest';
import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('speaks French for room, session and rule errors', () => {
    expect(errorMessage('NICKNAME_TAKEN')).toBe('Ce pseudo est déjà pris à cette table.');
    expect(errorMessage('NOT_YOUR_TURN')).toBe("Ce n'est pas votre tour.");
    expect(errorMessage('SESSION_OVER')).toBe('La partie est terminée.');
  });
});
