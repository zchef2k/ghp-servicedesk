import { Octokit } from '@octokit/rest';
import { config } from './config';
import { getToken } from './auth';

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

export async function setTicketAssignees(number: number, assignees: string[]): Promise<Ticket> {
  const client = getClient();
  const { data } = await client.issues.update({ ...dataRepo, issue_number: number, assignees });
  return toTicket(data);
}

export async function setTicketState(number: number, state: 'open' | 'closed'): Promise<Ticket> {
  const client = getClient();
  const { data } = await client.issues.update({ ...dataRepo, issue_number: number, state });
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

export async function addComment(number: number, body: string): Promise<Comment> {
  const client = getClient();
  const { data } = await client.issues.createComment({ ...dataRepo, issue_number: number, body });
  return {
    id: data.id,
    body: data.body ?? '',
    author: data.user?.login ?? 'unknown',
    createdAt: data.created_at,
  };
}

/** Fetches collaborators on the data repo, for use as assignee options. */
export async function listAssignableUsers(): Promise<string[]> {
  const client = getClient();
  const { data } = await client.issues.listAssignees({ ...dataRepo, per_page: 100 });
  return data.map((u) => u.login);
}
