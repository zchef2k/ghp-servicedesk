import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createTicket, listArticles, type Ticket } from '../lib/github';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from '../lib/labels';
import { searchArticles } from '../lib/kbSearch';
import { appPath } from '../lib/url';

export default function NewTicketForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<string>(TYPE_LABELS[0]);
  const [priority, setPriority] = useState<string>(PRIORITY_LABELS[1]);
  const [category, setCategory] = useState<string>(CATEGORY_LABELS[3]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [articles, setArticles] = useState<Ticket[]>([]);

  useEffect(() => {
    listArticles().then(setArticles).catch(() => {});
  }, []);

  const suggestions = useMemo(() => searchArticles(articles, `${title} ${body}`, 3), [articles, title, body]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const ticket = await createTicket({
        title: title.trim(),
        body,
        labels: [STATUS_LABELS[0], type, priority, category],
      });
      // GitHub's issue-list endpoint can lag a few seconds after creation, so
      // stash the new ticket for the queue to show immediately.
      sessionStorage.setItem('recentTicket', JSON.stringify(ticket));
      window.location.href = appPath();
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

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            {TYPE_LABELS.map((l) => (
              <option key={l} value={l}>{l.replace('type:', '')}</option>
            ))}
          </select>
        </label>

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

      {suggestions.length > 0 && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-900">Related articles</p>
          <p className="text-sm text-blue-800">This might already answer your question:</p>
          <ul className="mt-2 space-y-1">
            {suggestions.map((article) => (
              <li key={article.number}>
                <a
                  href={appPath(`kb/article/?id=${article.number}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-700 underline hover:text-blue-900"
                >
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

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
