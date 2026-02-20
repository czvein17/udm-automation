# Automation Logs Feature Flow

This document explains the logging feature we implemented end-to-end: how logs are created, stored, streamed, and rendered.

## 1) High-level flow

1. Automation code emits structured log events (with context) through the logger utility.
2. Logger prints readable CLI lines and POSTs the same structured payload to server API.
3. Server parses/validates payload, stores it in SQLite (`automation_logs`), and broadcasts it to WS subscribers.
4. Client loads initial history via REST, then receives live updates via WebSocket.
5. Logs UI normalizes noisy/raw events into grouped, human-readable Row cards.

---

## 2) Data model

Shared schema is the source of truth:

- `shared/src/schema/logs.schema.ts`

Main types:

- `LogEvent`
  - `id`, `runId`, `jobId?`, `runnerId?`, `ts`, `level`, `message`
  - `meta?` for extra data
  - `ctx?` for contextual keys like `fieldName`, `elementId`, `taskId`, etc.
  - `raw?`, `source`
- `LogContext`
  - `fieldName`, `elementId`, `elementName`, `displayName`, `tableName`, `taskId`, `surveyline`, `automationType`

---

## 3) Automation side

Key files:

- `automation/src/shared/logger.ts`
- `automation/src/shared/logger.util.ts`
- `automation/src/jobs/udm-automation/index.ts`
- `automation/src/jobs/udm-automation/start-automation.ts`
- `automation/src/jobs/udm-automation/edit-attibutes.ts`

### Logger behavior

- Prints readable console output (`[HH:mm:ss] LEVEL label key=value ...`).
- Sends structured `LogEvent` to server: `POST /api/v1/runs/:runId/logs`.
- Supports context-aware logging (`ctx`) to enrich UI grouping.

### Helper util

`createFeatureLogger(...)` in `logger.util.ts` gives an easy entrypoint for new features:

- one setup call per feature/job
- optional default context
- `withContext(ctx)` helper for repeated task-level logging

---

## 4) Server side

Key files:

- `server/src/feature/logs/logs.schema.ts`
- `server/src/feature/logs/logs.parser.ts`
- `server/src/feature/logs/logs.repo.ts`
- `server/src/feature/logs/logs.routes.ts`
- `server/src/feature/logs/logs.ws.ts`
- `server/src/db/schema.ts`
- `server/src/db/client.ts`
- `server/src/index.ts`

### Storage

SQLite table: `automation_logs`

- stores core log fields + `seq` cursor
- `meta/ctx/source` are packed into `metaJson` for compatibility

### API

- `GET /api/v1/runs/:runId/logs?cursor=&limit=`
  - paginated history
- `POST /api/v1/runs/:runId/logs`
  - accepts structured event or raw line shape (parser handles both)

### WebSocket

- endpoint: `/ws/logs/:runId`
- room model: `logs:<runId>`
- emits:
  - `logs:batch` on connect (initial latest logs)
  - `logs:line` for each new event

---

## 5) Client side

Key files:

- `client/src/features/UDMAutomations/hooks/useLogsStream.ts`
- `client/src/features/UDMAutomations/components/LogsTerminal.tsx`
- `client/src/features/UDMAutomations/pages/LogsSection.tsx`
- `client/src/routes/app/index.tsx`

### Stream hook

`useLogsStream(runId)`:

- initial load from REST
- live stream from WS
- reconnect attempts with backoff
- keeps memory capped to 5000 items
- keeps logs visible even during disconnect/reconnect

### UI rendering

`LogsTerminal.tsx`:

- normalizes each incoming event into a display row
- filters noise lines / separators
- compacts stack traces
- extracts run header info
- groups rows into `Row N` blocks focused on:
  - Field Name
  - Element Name
  - Element ID
  - URL
  - Actions list
- surfaces errors as:
  - per-row `ISSUES`
  - global issues panel

The detailed raw timeline was intentionally removed to keep the UI focused.

---

## 6) End-to-end sequence (example)

1. UDM automation runs.
2. `logger.info("navigate", { url }, ctx)` is called.
3. Logger prints readable line + POSTs `LogEvent`.
4. Server stores event and broadcasts to room `logs:<runId>`.
5. Browser receives `logs:line`, appends in memory.
6. `LogsTerminal` groups it under a matching `Row N` based on context (`taskId`/field/element).

---

## 7) User-facing log lifecycle (step-by-step)

This is the practical flow users see in the Logs UI for one task row.

1. Task starts and opens the record page.

- event emitted: `navigate`
- action shown: `Navigate: <url>`

2. Element state is checked.

- event emitted: `element_status` (meta: `status`)
- action shown: `Element Status: Approved | Draft | Pending | ...`

3. Language selection is attempted (if translation is not English).

- event emitted: `language_select_attempt` (meta: `translation`)
- action shown: `Language Select: <language>`

4. Language selection success is recorded.

- event emitted: `language_selected` (meta: `selected=true`)
- action shown: `Language Selected: Yes`

5. Automation type action runs (or is skipped).

- event emitted: `automation_action` or `automation_action_skipped`
- action shown: `Automation Action: <name>` or `Automation Skipped: <type>`

6. Any failures are surfaced.

- event emitted: `*_error` (level: `error`, meta: `err`)
- shown in row `ISSUES` or `global Issues` panel

Row grouping key priority in UI:

1. `taskId`
2. fallback composite: `fieldName + elementId + elementName + displayName + tableName`

So, as long as `ctx.taskId` is present, all related events stay in the same row card.

---

## 8) Event-to-UI action mapping

| Event key                   | Required meta/ctx     | User action text              |
| --------------------------- | --------------------- | ----------------------------- |
| `navigate`                  | `meta.url`            | `Navigate: <url>`             |
| `element_status`            | `meta.status`         | `Element Status: <Status>`    |
| `language_select_attempt`   | `meta.translation`    | `Language Select: <Language>` |
| `language_selected`         | `meta.selected`       | `Language Selected: Yes/No`   |
| `automation_action`         | `meta.action`         | `Automation Action: <Action>` |
| `automation_action_skipped` | `meta.automationType` | `Automation Skipped: <Type>`  |

If `meta` is missing, UI falls back to safe defaults (`Unknown` / `-`) so the panel remains readable.

---

## 9) How to extend for a new automation feature

1. Create logger once via `createFeatureLogger(...)`.
2. Build per-task context via `buildTaskContext(...)`.
3. Log actions with short labels + small `meta` payloads.
4. Prefer stable labels (`navigate`, `element_status`, `task_start`, etc.) so UI grouping remains predictable.

---

## 10) Notes / constraints

- Keep backend stream format unchanged (already integrated).
- Keep UI parser tolerant of mixed payload quality.
- Keep logic simple (KISS), no additional state machine or dependency required.
