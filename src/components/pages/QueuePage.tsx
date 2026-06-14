import AuthGate from '../AuthGate';
import MetricsDashboard from '../MetricsDashboard';
import TicketQueue from '../TicketQueue';

export default function QueuePage() {
  return (
    <AuthGate>
      <MetricsDashboard />
      <h1 className="mb-3 mt-6 text-lg font-semibold">Queue</h1>
      <TicketQueue />
    </AuthGate>
  );
}
