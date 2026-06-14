import { useEffect, useState } from 'react';
import { getArticle, updateArticle, type Ticket } from '../lib/github';
import { findLabel, replaceLabel, CATEGORY_LABELS } from '../lib/labels';
import { useImagePaste } from '../lib/useImagePaste';
import { appPath } from '../lib/url';
import Markdown from './Markdown';
import MarkdownToolbar from './MarkdownToolbar';

export default function KbArticle({ number }: { number: number }) {
  const [article, setArticle] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string>('');
  const { textareaRef, onPaste, onDrop, uploading } = useImagePaste(setBody);

  useEffect(() => {
    getArticle(number)
      .then((a) => {
        setArticle(a);
        setTitle(a.title);
        setBody(a.body);
        setCategory(findLabel(a.labels, CATEGORY_LABELS) ?? '');
      })
      .catch((err) => setError(err.message ?? 'Failed to load article'));
  }, [number]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!article) return <p className="text-slate-500">Loading article…</p>;

  async function save() {
    setBusy(true);
    try {
      const labels = category ? replaceLabel(article!.labels, category) : article!.labels;
      const updated = await updateArticle(article!.number, { title: title.trim(), body, labels });
      setArticle(updated);
      setEditing(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save article');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <a href={appPath('kb')} className="text-sm text-slate-500 hover:underline">
        ← Back to knowledge base
      </a>

      {editing ? (
        <div className="mt-2 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Body (Markdown)</span>
            <MarkdownToolbar textareaRef={textareaRef} setValue={setBody} />
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onPaste={onPaste}
              onDrop={onDrop}
              rows={12}
              className="w-full rounded-b-md rounded-t-none border border-slate-300 px-3 py-2 font-mono text-sm"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Paste or drop images to attach them.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="">None</option>
              {CATEGORY_LABELS.map((l) => (
                <option key={l} value={l}>{l.replace('category:', '')}</option>
              ))}
            </select>
          </label>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              disabled={busy || !title.trim() || uploading > 0}
              onClick={save}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {uploading > 0 ? 'Uploading image…' : busy ? 'Saving…' : 'Save'}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setTitle(article.title);
                setBody(article.body);
                setCategory(findLabel(article.labels, CATEGORY_LABELS) ?? '');
              }}
              className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">{article.title}</h1>
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              Edit
            </button>
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
            <Markdown text={article.body} />
          </div>
        </>
      )}
    </div>
  );
}
