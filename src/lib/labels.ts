// Label taxonomy used on the data repo. These must exist as labels on
// `config.dataRepoOwner/config.dataRepoName` (see README setup steps).

export const STATUS_LABELS = [
  'status:open',
  'status:in-progress',
  'status:waiting-on-requester',
  'status:resolved',
] as const;

export const PRIORITY_LABELS = [
  'priority:low',
  'priority:medium',
  'priority:high',
  'priority:urgent',
] as const;

export const CATEGORY_LABELS = [
  'category:hardware',
  'category:software',
  'category:access',
  'category:other',
] as const;

export type StatusLabel = (typeof STATUS_LABELS)[number];
export type PriorityLabel = (typeof PRIORITY_LABELS)[number];
export type CategoryLabel = (typeof CATEGORY_LABELS)[number];

const PREFIXES = ['status:', 'priority:', 'category:'];

/** Returns the first label on an issue matching one of the given taxonomy values. */
export function findLabel<T extends string>(
  issueLabels: string[],
  taxonomy: readonly T[]
): T | undefined {
  return taxonomy.find((t) => issueLabels.includes(t));
}

/** Replaces any existing label sharing the same prefix (e.g. 'status:') with `newLabel`. */
export function replaceLabel(issueLabels: string[], newLabel: string): string[] {
  const prefix = PREFIXES.find((p) => newLabel.startsWith(p));
  const withoutPrefix = prefix
    ? issueLabels.filter((l) => !l.startsWith(prefix))
    : issueLabels;
  return [...withoutPrefix, newLabel];
}
