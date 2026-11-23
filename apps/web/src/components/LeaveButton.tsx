import { fr } from '../strings/fr';
import { ConfirmButton } from './ConfirmButton';

/**
 * Leaves the table (AGENTS.md §5). During a session a bot takes the seat, so it asks first, in
 * place; in the lobby or once the session is over it leaves at once.
 */
export function LeaveButton({ confirm, onLeave }: { confirm: boolean; onLeave: () => void }) {
  return <ConfirmButton words={fr.leave} ask={confirm} onConfirm={onLeave} />;
}
