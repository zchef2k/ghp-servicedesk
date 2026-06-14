import { useEffect, useState } from 'react';
import { listTickets, type Ticket } from '../lib/github';
import { findLabel, PRIORITY_LABELS, STATUS_LABELS } from '../lib/labels';
import { appPath } from '../lib/url';

const PRIORITY_STYLES: Record<string, string> = {
  'priority:urgent': 'bg-red-100 text-red-800',
  'priority:high': 'bg-orange-100 text-orange-800',
  'priority:medium': 'bg-yellow-100 text-yellow-800',
  'priority:low': 'bg-slate-100 text-slate-700',
};

export default function TicketQueue() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [includeClosed, setIncludeClosed] = useState(false);

  useEffect(() => {
    const labels = [statusFilter, priorityFilter].filter(Boolean);
    listTickets({ state: includeClosed ? 'all' : 'open', labels })
      .then((fetched) => {
        // A just-created ticket may not show up yet due to GitHub's
        // issue-list indexing lag, so merge it in if it matches the filters.
        const raw = sessionStorage.getItem('recentTicket');
        if (!raw) {
          setTickets(fetched);
          return;
        }
        sessionStorage.removeItem('recentTicket');
        const recent: Ticket = JSON.parse(raw);
        if (fetched.some((t) => t.number === recent.number)) {
          setTickets(fetched);
          return;
        }
        const matchesStatus = !statusFilter || recent.labels.includes(statusFilter);
        const matchesPriority = !priorityFilter || recent.labels.includes(priorityFilter);
        const matchesState = includeClosed || recent.state === 'open';
        setTickets(matchesStatus && matchesPriority && matchesState ? [recent, ...fetched] : fetched);
      })
      .catch((err) => setError(err.message ?? 'Failed to load tickets'));
  }, [statusFilter, priorityFilter, includeClosed]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (tickets === null) return <p className="text-slate-500">Loading tickets…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_LABELS.map((l) => (
            <option key={l} value={l}>{l.replace('status:', '')}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">All priorities</option>
          {PRIORITY_LABELS.map((l) => (
            <option key={l} value={l}>{l.replace('priority:', '')}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={includeClosed}
            onChange={(e) => setIncludeClosed(e.target.checked)}
          />
          Include closed
        </label>
      </div>

      {tickets.length === 0 ? (
        <p className="text-slate-500">No tickets match these filters.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {tickets.map((ticket) => {
            const status = findLabel(ticket.labels, STATUS_LABELS);
            const priority = findLabel(ticket.labels, PRIORITY_LABELS);
            return (
              <li key={ticket.number}>
                <a
                  href={appPath(`ticket/?id=${ticket.number}`)}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      #{ticket.number} {ticket.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {ticket.state === 'closed' ? 'Closed' : status?.replace('status:', '') ?? 'open'}
                      {ticket.assignees.length > 0 && ` · ${ticket.assignees.join(', ')}`}
                    </p>
                  </div>
                  {priority && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority] ?? ''}`}>
                      {priority.replace('priority:', '')}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
