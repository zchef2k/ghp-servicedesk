import AuthGate from '../AuthGate';
import MetricsDashboard from '../MetricsDashboard';
import TicketQueue from '../TicketQueue';
import { appPath } from '../../lib/url';

export default function QueuePage() {
  return (
    <AuthGate>
      <MetricsDashboard />
      <div className="mb-3 mt-6 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Tickets</h1>
        <a
          href={appPath('new')}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          New ticket
        </a>
      </div>
      <TicketQueue />
    </AuthGate>
  );
}
