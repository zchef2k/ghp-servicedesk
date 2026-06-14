# Ticket Workflow

This document describes the ticket lifecycle enforced by the app, modeled on
standard ITSM (incident/request) practice. It's the source of truth for the
status transitions implemented in [`src/lib/labels.ts`](src/lib/labels.ts)
(`STATUS_TRANSITIONS`) and [`src/lib/github.ts`](src/lib/github.ts).

## Roles

- **Requester** — the person who opened the ticket (`ticket.author`).
- **Agent** — anyone assigned to work the ticket (must be a collaborator on
  the data repo).

## Statuses

| Status | Meaning | Underlying issue state |
| :-- | :-- | :-- |
| `status:open` | New, not yet picked up by an agent. | `open` |
| `status:in-progress` | An agent is actively working the ticket. | `open` |
| `status:waiting-on-requester` | The agent needs more info or action from the requester before continuing. | `open` |
| `status:resolved` | The work is done. A resolution note has been recorded. | `closed` |

`status:resolved` is the only status that maps to a `closed` issue. Moving a
ticket *out* of `status:resolved` reopens the issue.

## Allowed transitions

```
status:open ──────────────┬──> status:in-progress ──┬──> status:waiting-on-requester ──┐
                           │           │ ^            │                                 │
                           │           │ └─────────────┘ (requester comments)           │
                           │           │                                                 │
                           └───────────┴────────────────────────────> status:resolved <─┘
                                          ^                                   │
                                          └───────────────────────────────────┘
                                            (reopen: in-progress or open)
```

| From | Allowed next |
| :-- | :-- |
| `status:open` | `status:in-progress`, `status:resolved` |
| `status:in-progress` | `status:waiting-on-requester`, `status:resolved`, `status:open` |
| `status:waiting-on-requester` | `status:in-progress`, `status:resolved` |
| `status:resolved` | `status:in-progress`, `status:open` (reopen) |

The status dropdown on a ticket only ever shows the current status plus its
allowed next statuses — you can't jump straight from `open` to
`waiting-on-requester`, for example.

## Auto-transitions

These happen automatically as a side effect of other actions, so the status
reflects reality without requiring a separate manual step:

- **Assigning a ticket while it's `status:open`** bumps it to
  `status:in-progress`. Assignment is treated as "an agent has picked this
  up."
- **The requester commenting while the ticket is
  `status:waiting-on-requester`** bumps it back to `status:in-progress` (and
  reopens the issue if it was somehow closed). This puts the ticket back in
  the agent's queue without requiring the agent to notice the comment and
  manually change the status.

Comments from anyone else (agents, other collaborators) never change status.

## Resolving a ticket

Moving to `status:resolved` requires a **resolution note**: a comment
describing how the issue was resolved. The UI prompts for this note and posts
it before closing the issue. A ticket cannot be silently closed without a
record of what was done.

## Priority and category

`priority:*` and `category:*` labels are independent of the lifecycle above
and can be changed freely at any time — they're metadata for triage/reporting,
not workflow state.

## SLA targets

Each priority has a resolution-time target, defined in
[`src/lib/sla.ts`](src/lib/sla.ts) (`SLA_HOURS`):

| Priority | Target |
| :-- | :-- |
| `priority:urgent` | 4 hours |
| `priority:high` | 1 day |
| `priority:medium` | 3 days |
| `priority:low` | 7 days |

A ticket's "age" runs from creation to now (or to its close time once
resolved). Any unresolved ticket older than its priority's target is flagged
**Overdue** in the queue and on the ticket page. Overdue is informational only
— it doesn't block any transition.

## Metrics

The `/metrics` page summarizes the current queue: open-ticket counts by status
and priority, the overdue count, average age of open tickets, and resolution
throughput (tickets resolved in the last 7/30 days, average resolution time).
It's a read-only view over the same data — no separate tracking is needed.
