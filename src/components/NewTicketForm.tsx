import { useState, type FormEvent } from 'react';
import { createTicket } from '../lib/github';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../lib/labels';

export default function NewTicketForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<string>(PRIORITY_LABELS[1]);
  const [category, setCategory] = useState<string>(CATEGORY_LABELS[3]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const ticket = await createTicket({
        title: title.trim(),
        body,
        labels: [STATUS_LABELS[0], priority, category],
      });
      window.location.href = `${import.meta.env.BASE_URL}ticket/?id=${ticket.number}`;
    } catch (err: any) {
      setError(err.message ?? 'Failed to create ticket');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">New Ticket</h1>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Title</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Description</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            {PRIORITY_LABELS.map((l) => (
              <option key={l} value={l}>{l.replace('priority:', '')}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            {CATEGORY_LABELS.map((l) => (
              <option key={l} value={l}>{l.replace('category:', '')}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit ticket'}
      </button>
    </form>
  );
}
