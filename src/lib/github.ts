import { Octokit } from '@octokit/rest';
import { config } from './config';
import { getToken } from './auth';
import { findLabel, replaceLabel, STATUS_LABELS, type StatusLabel } from './labels';

/** Creates an Octokit client authenticated as the logged-in user. Throws if not logged in. */
export function getClient(): Octokit {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  return new Octokit({ auth: token });
}

export const dataRepo = {
  owner: config.dataRepoOwner,
  repo: config.dataRepoName,
};

export interface Ticket {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  author: string;
}

function toTicket(issue: any): Ticket {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body ?? '',
    state: issue.state,
    labels: (issue.labels ?? []).map((l: any) => (typeof l === 'string' ? l : l.name)),
    assignees: (issue.assignees ?? []).map((a: any) => a.login),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at ?? null,
    author: issue.user?.login ?? 'unknown',
  };
}

/** Lists tickets (issues), optionally filtered by label. Excludes pull requests. */
export async function listTickets(opts: {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
} = {}): Promise<Ticket[]> {
  const client = getClient();
  const { data } = await client.issues.listForRepo({
    ...dataRepo,
    state: opts.state ?? 'open',
    labels: opts.labels?.join(','),
    per_page: 100,
  });
  return data.filter((issue) => !issue.pull_request).map(toTicket);
}

export async function getTicket(number: number): Promise<Ticket> {
  const client = getClient();
  const { data } = await client.issues.get({ ...dataRepo, issue_number: number });
  return toTicket(data);
}

export async function createTicket(opts: {
  title: string;
  body: string;
  labels: string[];
}): Promise<Ticket> {
  const client = getClient();
  const { data } = await client.issues.create({
    ...dataRepo,
    title: opts.title,
    body: opts.body,
    labels: opts.labels,
  });
  return toTicket(data);
}

export async function updateTicketLabels(number: number, labels: string[]): Promise<Ticket> {
  const client = getClient();
  const { data } = await client.issues.update({ ...dataRepo, issue_number: number, labels });
  return toTicket(data);
}

/**
 * Moves a ticket to `newStatus`, per the transitions in WORKFLOW.md. Posts
 * `note` first as a comment (required by the UI for resolution and change
 * approval) and keeps the underlying issue's open/closed state in sync:
 * `status:resolved` closes the issue, any other status reopens it.
 */
export async function transitionTicketStatus(opts: {
  number: number;
  labels: string[];
  newStatus: StatusLabel;
  note?: string;
}): Promise<{ ticket: Ticket; comment?: Comment }> {
  const client = getClient();

  let comment: Comment | undefined;
  if (opts.note?.trim()) {
    const { data } = await client.issues.createComment({
      ...dataRepo,
      issue_number: opts.number,
      body: opts.note.trim(),
    });
    comment = {
      id: data.id,
      body: data.body ?? '',
      author: data.user?.login ?? 'unknown',
      createdAt: data.created_at,
    };
  }

  const labels = replaceLabel(opts.labels, opts.newStatus);
  const state = opts.newStatus === 'status:resolved' ? 'closed' : 'open';
  const { data } = await client.issues.update({ ...dataRepo, issue_number: opts.number, labels, state });
  return { ticket: toTicket(data), comment };
}

/**
 * Sets assignees. If the ticket is still `status:open` and is being assigned
 * to someone, also bumps it to `status:in-progress` (assignment signals work
 * has started).
 */
export async function setTicketAssignees(
  number: number,
  assignees: string[],
  labels: string[]
): Promise<Ticket> {
  const client = getClient();
  const shouldStart = assignees.length > 0 && findLabel(labels, STATUS_LABELS) === 'status:open';
  const nextLabels = shouldStart ? replaceLabel(labels, 'status:in-progress') : labels;
  const { data } = await client.issues.update({
    ...dataRepo,
    issue_number: number,
    assignees,
    labels: nextLabels,
  });
  return toTicket(data);
}

export interface Comment {
  id: number;
  body: string;
  author: string;
  createdAt: string;
}

export async function listComments(number: number): Promise<Comment[]> {
  const client = getClient();
  const { data } = await client.issues.listComments({ ...dataRepo, issue_number: number, per_page: 100 });
  return data.map((c) => ({
    id: c.id,
    body: c.body ?? '',
    author: c.user?.login ?? 'unknown',
    createdAt: c.created_at,
  }));
}

/**
 * Posts a comment. If the commenter is the ticket's requester and the ticket
 * is `status:waiting-on-requester`, also moves it back to `status:in-progress`
 * to put it back in the agent's queue (per WORKFLOW.md).
 */
export async function addComment(opts: {
  number: number;
  body: string;
  labels: string[];
  isRequester: boolean;
}): Promise<{ comment: Comment; ticket?: Ticket }> {
  const client = getClient();
  const { data } = await client.issues.createComment({
    ...dataRepo,
    issue_number: opts.number,
    body: opts.body,
  });
  const comment: Comment = {
    id: data.id,
    body: data.body ?? '',
    author: data.user?.login ?? 'unknown',
    createdAt: data.created_at,
  };

  if (opts.isRequester && findLabel(opts.labels, STATUS_LABELS) === 'status:waiting-on-requester') {
    const labels = replaceLabel(opts.labels, 'status:in-progress');
    const { data: issueData } = await client.issues.update({
      ...dataRepo,
      issue_number: opts.number,
      labels,
      state: 'open',
    });
    return { comment, ticket: toTicket(issueData) };
  }

  return { comment };
}

/** Returns the username of the currently authenticated user. */
export async function getCurrentUser(): Promise<string> {
  const client = getClient();
  const { data } = await client.users.getAuthenticated();
  return data.login;
}

/** Fetches collaborators on the data repo, for use as assignee options. */
export async function listAssignableUsers(): Promise<string[]> {
  const client = getClient();
  const { data } = await client.issues.listAssignees({ ...dataRepo, per_page: 100 });
  return data.map((u) => u.login);
}
