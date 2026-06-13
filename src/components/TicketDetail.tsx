import { useEffect, useState } from 'react';
import {
  addComment,
  getTicket,
  listAssignableUsers,
  listComments,
  setTicketAssignees,
  setTicketState,
  updateTicketLabels,
  type Comment,
  type Ticket,
} from '../lib/github';
import { findLabel, PRIORITY_LABELS, replaceLabel, STATUS_LABELS, CATEGORY_LABELS } from '../lib/labels';

export default function TicketDetail({ number }: { number: number }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [t, c] = await Promise.all([getTicket(number), listComments(number)]);
    setTicket(t);
    setComments(c);
  }

  useEffect(() => {
    Promise.all([refresh(), listAssignableUsers().then(setAssignableUsers)]).catch((err) =>
      setError(err.message ?? 'Failed to load ticket')
    );
  }, [number]);

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (err: any) {
      setError(err.message ?? 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!ticket) return <p className="text-slate-500">Loading ticket…</p>;

  const status = findLabel(ticket.labels, STATUS_LABELS);
  const priority = findLabel(ticket.labels, PRIORITY_LABELS);
  const category = findLabel(ticket.labels, CATEGORY_LABELS);

  return (
    <div>
      <a href={import.meta.env.BASE_URL} className="text-sm text-slate-500 hover:underline">
        ← Back to queue
      </a>

      <h1 className="mt-2 text-xl font-semibold">
        #{ticket.number} {ticket.title}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Opened by {ticket.author} · {ticket.state === 'closed' ? 'Closed' : 'Open'}
      </p>

      <div className="mt-4 whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-4">
        {ticket.body || <span className="text-slate-400">No description provided.</span>}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Status">
          <select
            disabled={busy}
            value={status ?? ''}
            onChange={(e) =>
              withBusy(async () => {
                const labels = replaceLabel(ticket.labels, e.target.value);
                setTicket(await updateTicketLabels(ticket.number, labels));
              })
            }
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="" disabled>Select status</option>
            {STATUS_LABELS.map((l) => (
              <option key={l} value={l}>{l.replace('status:', '')}</option>
            ))}
          </select>
        </Field>

        <Field label="Priority">
          <select
            disabled={busy}
            value={priority ?? ''}
            onChange={(e) =>
              withBusy(async () => {
                const labels = replaceLabel(ticket.labels, e.target.value);
                setTicket(await updateTicketLabels(ticket.number, labels));
              })
            }
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="" disabled>Select priority</option>
            {PRIORITY_LABELS.map((l) => (
              <option key={l} value={l}>{l.replace('priority:', '')}</option>
            ))}
          </select>
        </Field>

        <Field label="Category">
          <select
            disabled={busy}
            value={category ?? ''}
            onChange={(e) =>
              withBusy(async () => {
                const labels = replaceLabel(ticket.labels, e.target.value);
                setTicket(await updateTicketLabels(ticket.number, labels));
              })
            }
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="" disabled>Select category</option>
            {CATEGORY_LABELS.map((l) => (
              <option key={l} value={l}>{l.replace('category:', '')}</option>
            ))}
          </select>
        </Field>

        <Field label="Assignee">
          <select
            disabled={busy}
            value={ticket.assignees[0] ?? ''}
            onChange={(e) =>
              withBusy(async () => {
                const assignees = e.target.value ? [e.target.value] : [];
                setTicket(await setTicketAssignees(ticket.number, assignees));
              })
            }
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">Unassigned</option>
            {assignableUsers.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </Field>

        <Field label="State">
          <button
            disabled={busy}
            onClick={() =>
              withBusy(async () => {
                const next = ticket.state === 'closed' ? 'open' : 'closed';
                setTicket(await setTicketState(ticket.number, next));
              })
            }
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
          >
            {ticket.state === 'closed' ? 'Reopen' : 'Close ticket'}
          </button>
        </Field>
      </div>

      <h2 className="mt-6 text-lg font-semibold">Comments</h2>
      <ul className="mt-2 space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-sm font-medium">{c.author}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          disabled={busy || !newComment.trim()}
          onClick={() =>
            withBusy(async () => {
              const comment = await addComment(ticket.number, newComment.trim());
              setComments((prev) => [...prev, comment]);
              setNewComment('');
            })
          }
          className="mt-2 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Comment
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}
