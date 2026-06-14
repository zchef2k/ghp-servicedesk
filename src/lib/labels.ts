// Label taxonomy used on the data repo. These must exist as labels on
// `config.dataRepoOwner/config.dataRepoName` (see README setup steps).

export const STATUS_LABELS = [
  'status:open',
  'status:pending-approval',
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

export const TYPE_LABELS = [
  'type:incident',
  'type:service-request',
  'type:change',
] as const;

export type StatusLabel = (typeof STATUS_LABELS)[number];
export type PriorityLabel = (typeof PRIORITY_LABELS)[number];
export type CategoryLabel = (typeof CATEGORY_LABELS)[number];
export type TypeLabel = (typeof TYPE_LABELS)[number];

/**
 * Valid next statuses from each status, per the ticket lifecycle in WORKFLOW.md.
 * `status:resolved` closes the underlying issue; transitioning away from it reopens it.
 * `status:pending-approval` is only reachable from `status:open` on `type:change` tickets.
 */
export const STATUS_TRANSITIONS: Record<StatusLabel, readonly StatusLabel[]> = {
  'status:open': ['status:in-progress', 'status:resolved'],
  'status:pending-approval': ['status:in-progress', 'status:open'],
  'status:in-progress': ['status:waiting-on-requester', 'status:resolved', 'status:open'],
  'status:waiting-on-requester': ['status:in-progress', 'status:resolved'],
  'status:resolved': ['status:in-progress', 'status:open'],
};

/** Returns the statuses a ticket can move to from its current status. */
export function nextStatuses(current: StatusLabel | undefined, type?: TypeLabel): readonly StatusLabel[] {
  if (!current) return STATUS_LABELS;
  if (current === 'status:open' && type === 'type:change') {
    return ['status:pending-approval', 'status:resolved'];
  }
  return STATUS_TRANSITIONS[current];
}

/**
 * Whether moving from `from` to `to` requires a note (posted as a comment
 * before the transition). Resolving always requires a resolution note;
 * approving a `type:change` out of `status:pending-approval` requires an
 * approval note.
 */
export function transitionRequiresNote(from: StatusLabel | undefined, to: StatusLabel): boolean {
  if (to === 'status:resolved') return true;
  if (from === 'status:pending-approval' && to === 'status:in-progress') return true;
  return false;
}

const PREFIXES = ['status:', 'priority:', 'category:', 'type:'];

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
