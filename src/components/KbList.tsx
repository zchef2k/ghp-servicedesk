import { useEffect, useState } from 'react';
import { listArticles, type Ticket } from '../lib/github';
import { searchArticles } from '../lib/kbSearch';
import { findLabel, CATEGORY_LABELS } from '../lib/labels';
import { appPath } from '../lib/url';

export default function KbList() {
  const [articles, setArticles] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    listArticles()
      .then(setArticles)
      .catch((err) => setError(err.message ?? 'Failed to load articles'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (articles === null) return <p className="text-slate-500">Loading articles…</p>;

  const filtered = articles.filter((a) => !categoryFilter || a.labels.includes(categoryFilter));
  const results = query.trim() ? searchArticles(filtered, query, filtered.length) : filtered;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Knowledge Base</h1>
        <a
          href={appPath('kb/new')}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          New article
        </a>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          className="min-w-48 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">All categories</option>
          {CATEGORY_LABELS.map((l) => (
            <option key={l} value={l}>{l.replace('category:', '')}</option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <p className="text-slate-500">No articles match.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {results.map((article) => {
            const category = findLabel(article.labels, CATEGORY_LABELS);
            return (
              <li key={article.number}>
                <a
                  href={appPath(`kb/article/?id=${article.number}`)}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                >
                  <p className="truncate font-medium">{article.title}</p>
                  {category && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {category.replace('category:', '')}
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
