import { useEffect, useState } from 'react';
import {
  addComment,
  getCurrentUser,
  getTicket,
  listAssignableUsers,
  listComments,
  setTicketAssignees,
  transitionTicketStatus,
  updateTicketLabels,
  type Comment,
  type Ticket,
} from '../lib/github';
import {
  findLabel,
  nextStatuses,
  PRIORITY_LABELS,
  replaceLabel,
  STATUS_LABELS,
  CATEGORY_LABELS,
  TYPE_LABELS,
  transitionRequiresNote,
  type StatusLabel,
} from '../lib/labels';
import { ageHours, formatDuration, isOverdue, slaHours } from '../lib/sla';
import { appPath } from '../lib/url';

function stashedCommentsKey(number: number) {
  return `recentComments:${number}`;
}

function getStashedComments(number: number): Comment[] {
  const raw = sessionStorage.getItem(stashedCommentsKey(number));
  return raw ? JSON.parse(raw) : [];
}

// A just-posted comment may not show up in listComments yet due to GitHub's
// indexing lag, so stash it until it appears in a fetch.
function stashComment(number: number, comment: Comment) {
  sessionStorage.setItem(stashedCommentsKey(number), JSON.stringify([...getStashedComments(number), comment]));
}

function pruneStashedComments(number: number, fetched: Comment[]): Comment[] {
  const remaining = getStashedComments(number).filter((c) => !fetched.some((f) => f.id === c.id));
  if (remaining.length) {
    sessionStorage.setItem(stashedCommentsKey(number), JSON.stringify(remaining));
  } else {
    sessionStorage.removeItem(stashedCommentsKey(number));
  }
  return remaining;
}

export default function TicketDetail({ number }: { number: number }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [pendingStatus, setPendingStatus] = useState<StatusLabel | null>(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [t, c] = await Promise.all([getTicket(number), listComments(number)]);
    setTicket(t);
    const stashed = pruneStashedComments(number, c);
    setComments([...c, ...stashed]);
  }

  useEffect(() => {
    Promise.all([
      refresh(),
      listAssignableUsers().then(setAssignableUsers),
      getCurrentUser().then(setCurrentUser),
    ]).catch((err) => setError(err.message ?? 'Failed to load ticket'));
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

  const current = ticket;
  const status = findLabel(current.labels, STATUS_LABELS);
  const priority = findLabel(current.labels, PRIORITY_LABELS);
  const category = findLabel(current.labels, CATEGORY_LABELS);
  const type = findLabel(current.labels, TYPE_LABELS);
  const statusOptions = status ? [status, ...nextStatuses(status, type)] : STATUS_LABELS;
  const overdue = isOverdue(current);
  const target = slaHours(current);
  const isApproval = pendingStatus === 'status:in-progress' && status === 'status:pending-approval';

  function handleStatusChange(newStatus: StatusLabel) {
    if (newStatus === status) return;
    if (transitionRequiresNote(status, newStatus)) {
      setPendingStatus(newStatus);
      setTransitionNote('');
      return;
    }
    withBusy(async () => {
      const { ticket: updated } = await transitionTicketStatus({ number: current.number, labels: current.labels, newStatus });
      setTicket(updated);
    });
  }

  function confirmTransition() {
    if (!transitionNote.trim() || !pendingStatus) return;
    withBusy(async () => {
      const { ticket: updated, comment } = await transitionTicketStatus({
        number: current.number,
        labels: current.labels,
        newStatus: pendingStatus,
        note: transitionNote.trim(),
      });
      setTicket(updated);
      setPendingStatus(null);
      setTransitionNote('');
      if (comment) {
        setComments((prev) => [...prev, comment]);
        stashComment(current.number, comment);
      }
    });
  }

  return (
    <div>
      <a href={appPath()} className="text-sm text-slate-500 hover:underline">
        ← Back to tickets
      </a>

      <h1 className="mt-2 text-xl font-semibold">
        #{ticket.number} {ticket.title}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Opened by {ticket.author} · {ticket.state === 'closed' ? 'Closed' : 'Open'}
        {' · '}
        {ticket.state === 'closed' ? 'Took' : 'Open for'} {formatDuration(ageHours(ticket))}
        {target !== undefined && ` (target: ${formatDuration(target)})`}
        {overdue && (
          <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
            Overdue
          </span>
        )}
      </p>

      <div className="mt-4 whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-4">
        {ticket.body || <span className="text-slate-400">No description provided.</span>}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Type">
          <select
            disabled={busy}
            value={type ?? ''}
            onChange={(e) =>
              withBusy(async () => {
                const labels = replaceLabel(ticket.labels, e.target.value);
                setTicket(await updateTicketLabels(ticket.number, labels));
              })
            }
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="" disabled>Select type</option>
            {TYPE_LABELS.map((l) => (
              <option key={l} value={l}>{l.replace('type:', '')}</option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            disabled={busy}
            value={status ?? ''}
            onChange={(e) => handleStatusChange(e.target.value as StatusLabel)}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="" disabled>Select status</option>
            {statusOptions.map((l) => (
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
                setTicket(await setTicketAssignees(ticket.number, assignees, ticket.labels));
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
      </div>

      {pendingStatus && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            {isApproval
              ? 'Approving this change requires an approval note. It will be posted as a comment.'
              : 'Resolving this ticket requires a resolution note. It will be posted as a comment and the ticket will be closed.'}
          </p>
          <textarea
            value={transitionNote}
            onChange={(e) => setTransitionNote(e.target.value)}
            placeholder={isApproval ? 'Describe what was approved…' : 'Describe how this was resolved…'}
            rows={3}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button
              disabled={busy || !transitionNote.trim()}
              onClick={confirmTransition}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isApproval ? 'Approve change' : 'Resolve ticket'}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setPendingStatus(null);
                setTransitionNote('');
              }}
              className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
        {status === 'status:waiting-on-requester' && currentUser === ticket.author && (
          <p className="mt-1 text-xs text-slate-500">
            Commenting will move this ticket back to in-progress.
          </p>
        )}
        <button
          disabled={busy || !newComment.trim()}
          onClick={() =>
            withBusy(async () => {
              const result = await addComment({
                number: ticket.number,
                body: newComment.trim(),
                labels: ticket.labels,
                isRequester: currentUser === ticket.author,
              });
              setComments((prev) => [...prev, result.comment]);
              stashComment(current.number, result.comment);
              if (result.ticket) setTicket(result.ticket);
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
