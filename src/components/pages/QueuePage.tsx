import AuthGate from '../AuthGate';
import TicketQueue from '../TicketQueue';

export default function QueuePage() {
  return (
    <AuthGate>
      <TicketQueue />
    </AuthGate>
  );
}
