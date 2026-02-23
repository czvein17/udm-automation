# Automation Terminal: How It Works

This document explains the current Automation Terminal architecture and how the main functions work together across `automation`, `server`, and `client`.

## Overview

The terminal is **API-first**:

- Data is stored and fetched via REST endpoints.
- WebSocket is used only as a **signal bus** to tell clients to refetch.
- No stdout/stderr parsing is used as the terminal source.

## Contracts (shared)

Canonical contract file:

- `shared/src/automation/automationEvent.contract.ts`

Main shared types/schemas:

- `AutomationEventType`: `navigate | click | fill | validate | edited | success | error`
- `AutomationRunStatus`: `RUNNING | PAUSED | CANCELLED | SUCCESS | ERROR`
- `createAutomationEventBodySchema` for `POST /runs/:runId/events`
- `updateAutomationRunStatusBodySchema` for `PATCH /runs/:runId/status`

## Database model (server)

Defined in:

- `server/src/db/schema.ts`

Tables:

- `automation_runs` (`id`, `engine`, `status`, timestamps)
- `automation_tasks` (`id`, `runId`, task metadata, `url`)
- `automation_events` (`id`, `runId`, `taskId`, `seq`, `type`, `details`, `payloadJson`, `createdAt`)

Important indexes:

- unique `(runId, seq)`
- `(runId, seq)`
- `(runId, taskId, seq)`

## Server layers and responsibilities

### Routes

File:

- `server/src/feature/automationTerminal/automationTerminal.routes.ts`

Endpoints:

- `POST /api/v1/automation/runs/:runId/events`
  - validates body with shared Zod
  - stores event through service
  - emits WS signal `{ kind: "event", runId }`
- `GET /api/v1/automation/runs/:runId/terminal`
  - returns snapshot: run + tasks + newest events + next cursor
- `GET /api/v1/automation/runs/:runId/terminal/events`
  - returns older event pages via `beforeSeq`
- `PATCH /api/v1/automation/runs/:runId/status`
  - updates run status
  - emits WS signal `{ kind: "state", runId }`

### Service

File:

- `server/src/feature/automationTerminal/automationTerminal.service.ts`

Main functions:

- `createAutomationEvent(...)`
  - `ensureRun`
  - `upsertTaskFromEvent`
  - assign next `seq = max + 1`
  - insert event
- `getAutomationTerminalSnapshot(...)`
  - parse query (`limit`, `beforeSeq`)
  - fetch run + tasks + events
  - compute `nextBeforeSeq`
- `getAutomationTerminalEventsPage(...)`
  - fetch older events only, compute next cursor
- `updateAutomationRunStatus(...)`
  - ensure run exists and patch status

### Repository

File:

- `server/src/feature/automationTerminal/automationTerminal.repo.ts`

Main responsibilities:

- persistence and querying
- payload JSON serialization/deserialization
- task metadata upsert from event payload + fallback from `tasks`
- cursor pagination by sequence

### WebSocket signal bus

File:

- `server/src/feature/automationTerminal/automationTerminal.ws.ts`

Protocol:

- client -> `{ kind: "subscribe", runId }`
- server -> `{ kind: "subscribed", runId }`
- server -> `{ kind: "event", runId }` (signal only)
- server -> `{ kind: "state", runId }` (signal only)

Notes:

- WS does not carry snapshot or event payload anymore.
- On signal, clients refetch through REST.

## Automation writer flow

Reporter file:

- `automation/src/reporter/automationReporter.ts`

Main function:

- `createAutomationReporter({ runId, taskId, taskMeta, serverBaseUrl? })`
  - returns `emit({ type, details, payload? })`
  - sends `POST /api/v1/automation/runs/:runId/events`

Where it is used:

- `automation/src/jobs/udm-automation/start-automation.ts`
- `automation/src/jobs/udm-automation/re-approve.ts`
- `automation/src/jobs/udm-automation/edit-attibutes.ts`
- `automation/src/jobs/udm-automation/edit-applicabilities.ts`

Only curated, meaningful steps are emitted.

## Client reader flow

### API services

File:

- `client/src/features/UDMAutomations/services/automationTerminal.services.ts`

Functions:

- `getAutomationTerminalSnapshotService(runId, limit)`
- `getAutomationTerminalEventsPageService({ runId, beforeSeq, limit })`

### Live + snapshot hook

File:

- `client/src/features/UDMAutomations/hooks/useAutomationTerminalStream.ts`

How it works:

1. Uses TanStack `useQuery` for initial snapshot (REST).
2. Opens WS subscription for the run.
3. On `event` or `state` signal, triggers debounced `snapshotQuery.refetch()`.
4. Merges fresh API data into local state (`mergeEvents`, `mergeTasks`).

### Older history hook

File:

- `client/src/features/UDMAutomations/hooks/useAutomationTerminalHistory.ts`

How it works:

- Uses TanStack `useMutation` to request older event page by `beforeSeq`.
- Returns page to UI for prepend + cursor update.

### Terminal page composition

File:

- `client/src/features/UDMAutomations/pages/AutomationTerminalPage.tsx`

Responsibilities:

- combines stream + history hooks
- handles autoscroll guard (only when near bottom)
- preserves scroll position on prepend
- supports history mode and per-task expansion
- renders task cards from grouped view model (`buildTaskCards`)

Related components:

- `client/src/features/UDMAutomations/components/logs/AutomationTerminalTopBar.tsx`
- `client/src/features/UDMAutomations/components/logs/AutomationTaskCard.tsx`
- `client/src/features/UDMAutomations/components/logs/AutomationTaskHeader.tsx`
- `client/src/features/UDMAutomations/components/logs/AutomationEventList.tsx`

## End-to-end sequence

1. User starts a run.
2. Automation emits curated step via reporter POST.
3. Server stores event and emits WS signal `event`.
4. Client receives signal and refetches snapshot via REST.
5. UI updates task cards with newest events.
6. User loads older pages with `beforeSeq` when needed.

## Why this design

- API-first consistency for data transactions
- simple and stable WS semantics (signal-only)
- easier debugging (single source of truth is REST + DB)
- scalable history retrieval with sequence cursor and indexes
