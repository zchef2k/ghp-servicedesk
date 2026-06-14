import { findLabel, PRIORITY_LABELS, type PriorityLabel } from './labels';
import type { Ticket } from './github';

/**
 * Resolution-time targets per priority, in hours. A ticket is "overdue" if
 * it's still unresolved and older than its priority's target. See
 * WORKFLOW.md for the rationale.
 */
export const SLA_HOURS: Record<PriorityLabel, number> = {
  'priority:urgent': 4,
  'priority:high': 24,
  'priority:medium': 72,
  'priority:low': 168,
};

const HOUR_MS = 60 * 60 * 1000;

/** Age of a ticket in hours, from creation to now (or to close time if resolved). */
export function ageHours(ticket: Ticket): number {
  const start = new Date(ticket.createdAt).getTime();
  const end = ticket.closedAt ? new Date(ticket.closedAt).getTime() : Date.now();
  return (end - start) / HOUR_MS;
}

/** SLA target for a ticket's priority, or undefined if it has no priority label. */
export function slaHours(ticket: Ticket): number | undefined {
  const priority = findLabel(ticket.labels, PRIORITY_LABELS);
  return priority ? SLA_HOURS[priority] : undefined;
}

/** Whether an unresolved ticket has exceeded its priority's SLA target. */
export function isOverdue(ticket: Ticket): boolean {
  if (ticket.state === 'closed') return false;
  const target = slaHours(ticket);
  return target !== undefined && ageHours(ticket) > target;
}

/** Formats an hours duration as a short human string, e.g. "45m", "6h", "3d". */
export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
