import { useState, type FormEvent } from 'react';
import { createArticle } from '../lib/github';
import { CATEGORY_LABELS } from '../lib/labels';
import { useImagePaste } from '../lib/useImagePaste';
import { appPath } from '../lib/url';

export default function NewArticleForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string>(CATEGORY_LABELS[3]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { textareaRef, onPaste, onDrop, uploading } = useImagePaste(setBody);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const article = await createArticle({ title: title.trim(), body, category });
      window.location.href = appPath(`kb/article/?id=${article.number}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create article');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">New Article</h1>

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
        <span className="mb-1 block text-sm font-medium">Body (Markdown)</span>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onPaste={onPaste}
          onDrop={onDrop}
          rows={12}
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
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
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm sm:w-48"
        >
          {CATEGORY_LABELS.map((l) => (
            <option key={l} value={l}>{l.replace('category:', '')}</option>
          ))}
        </select>
      </label>

      {error && <p className="text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !title.trim() || uploading > 0}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {uploading > 0 ? 'Uploading image…' : submitting ? 'Submitting…' : 'Create article'}
      </button>
    </form>
  );
}
