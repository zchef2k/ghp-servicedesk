import type { Ticket } from './github';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of', 'in',
  'on', 'for', 'and', 'or', 'but', 'with', 'how', 'do', 'i', 'my', 'it', 'this',
  'that', 'not', 'can', 'cannot', 'as', 'at', 'by', 'from', 'has', 'have',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Scores articles against a free-text query and returns the top matches.
 * Title-token matches count double; body-token matches count single.
 */
export function searchArticles(articles: Ticket[], query: string, limit = 5): Ticket[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored = articles.map((article) => {
    const titleTokens = tokenize(article.title);
    const bodyTokens = tokenize(article.body);
    let score = 0;
    for (const token of queryTokens) {
      if (titleTokens.includes(token)) score += 2;
      if (bodyTokens.includes(token)) score += 1;
    }
    return { article, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ article }) => article);
}
