import type { ServerErrorCode } from '@tarot/protocol';
import { fr } from '../strings/fr';

export function errorMessage(code: ServerErrorCode): string {
  return fr.errors[code];
}
