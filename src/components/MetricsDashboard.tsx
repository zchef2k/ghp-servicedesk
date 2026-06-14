import { useEffect, useState } from 'react';
import { listTickets, type Ticket } from '../lib/github';
import { findLabel, PRIORITY_LABELS, STATUS_LABELS } from '../lib/labels';
import { ageHours, formatDuration, isOverdue } from '../lib/sla';

const DAY_HOURS = 24;

export default function MetricsDashboard() {
  const [open, setOpen] = useState<Ticket[] | null>(null);
  const [closed, setClosed] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listTickets({ state: 'open' }), listTickets({ state: 'closed' })])
      .then(([openTickets, closedTickets]) => {
        setOpen(openTickets);
        setClosed(closedTickets);
      })
      .catch((err) => setError(err.message ?? 'Failed to load metrics'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!open || !closed) return <p className="text-slate-500">Loading metrics…</p>;

  const overdueCount = open.filter(isOverdue).length;
  const avgOpenAge = average(open.map(ageHours));

  const now = Date.now();
  const resolvedSince = (days: number) =>
    closed.filter((t) => t.closedAt && now - new Date(t.closedAt).getTime() < days * DAY_HOURS * 60 * 60 * 1000).length;

  const recentlyResolved = closed.filter(
    (t) => t.closedAt && now - new Date(t.closedAt).getTime() < 30 * DAY_HOURS * 60 * 60 * 1000
  );
  const avgResolutionTime = average(recentlyResolved.map(ageHours));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Open tickets" value={String(open.length)} />
        <StatCard label="Overdue" value={String(overdueCount)} highlight={overdueCount > 0} />
        <StatCard label="Avg. open age" value={open.length ? formatDuration(avgOpenAge) : '—'} />
        <StatCard
          label="Avg. resolution (30d)"
          value={recentlyResolved.length ? formatDuration(avgResolutionTime) : '—'}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BreakdownCard
          title="Open by status"
          rows={STATUS_LABELS.map((l) => ({
            label: l.replace('status:', ''),
            count: open.filter((t) => findLabel(t.labels, STATUS_LABELS) === l).length,
          }))}
        />
        <BreakdownCard
          title="Open by priority"
          rows={PRIORITY_LABELS.map((l) => ({
            label: l.replace('priority:', ''),
            count: open.filter((t) => findLabel(t.labels, PRIORITY_LABELS) === l).length,
          }))}
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-500">Resolved tickets</h2>
        <div className="mt-2 flex gap-6 text-sm">
          <p><span className="font-semibold">{resolvedSince(7)}</span> in last 7 days</p>
          <p><span className="font-semibold">{resolvedSince(30)}</span> in last 30 days</p>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Based on the {open.length} most recently updated open and {closed.length} most recently
        updated closed tickets (up to 100 each).
      </p>
    </div>
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${highlight ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-medium text-slate-500">{title}</h2>
      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-sm">
            <span className="w-32 shrink-0 capitalize">{r.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-400"
                style={{ width: total ? `${(r.count / total) * 100}%` : '0%' }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-slate-500">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
