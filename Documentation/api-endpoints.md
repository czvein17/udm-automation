# API Endpoints Reference

This document lists all active backend endpoints in `udm-automation`, what each one is for, and the expected request/response shapes.

Base API prefix: `/api/v1`

## Quick Notes

- Most responses follow `ApiResponse<T>`:
  - `message: string`
  - `success: boolean`
  - `data: T`
- Validation is applied with shared Zod schemas on key write endpoints.
- Log streaming uses WebSocket and is outside `/api/v1`.

## Health / Base

### `GET /api/v1/`

- Purpose: simple router-level health response.
- Response: `{ message: "Hello from the main app router!" }`

### `GET /api/v1/hello`

- Purpose: API hello check.
- Response (`ApiResponse<null>`):
  - `message: "Hello BHVR!"`
  - `success: true`
  - `data: null`

## Automation Endpoints

Mounted from `server/src/feature/automation/automation.route.ts`.

### `POST /api/v1/automation/open`

- Purpose: create one task and start an automation run.
- Body: `createTaskSchema` (single task payload)
  - `fieldName`, `elementId`, `tableName`, optional `elementName`, optional `displayName`
- Response (`ApiResponse<{ runId: string }>`)

### `POST /api/v1/automation/open-multiple`

- Purpose: create multiple tasks and start one shared automation run.
- Body: `createTaskMultipleSchema` (array of task payloads)
- Response (`ApiResponse<{ runId: string }>`)

### `POST /api/v1/automation/task`

- Purpose: create a task record only.
- Body: `createTaskSchema`
- Response (`ApiResponse<Task | null>`)

### `GET /api/v1/automation/task`

- Purpose: fetch all task records.
- Response (`ApiResponse<Task[]>`)

### `GET /api/v1/automation/task/:runId`

- Purpose: fetch a single task by run ID.
- Response on found: `ApiResponse<Task>` with `success: true`
- Response on missing: `ApiResponse<null>` with status `404`

### `GET /api/v1/automation/task-list/:runId`

- Purpose: fetch all tasks linked to a run.
- Response (`ApiResponse<Task[]>`)

## Runs Endpoints

Mounted from `server/src/feature/runs/runs.route.ts`.

### `GET /api/v1/runs/`

- Purpose: return current run summary list (currently seeded/demo-like payload).
- Response: `ApiResponse<TaskRuns[]>`

### `GET /api/v1/runs/:runId`

- Purpose: return in-memory run state for one run.
- Response on found: raw run object (`RUNNING | SUCCESS | FAILED` + logs)
- Response on missing: `{ error: "Not found" }` with status `404`

## Task Logs Endpoints

Mounted from `server/src/feature/task/task.route.ts`.

### `GET /api/v1/tasks/:runId/logs`

- Purpose: fetch task logs grouped under a run.
- Response: `ApiResponse<any>` (service-driven shape)

### `POST /api/v1/tasks/logs`

- Purpose: create/update task log entries.
- Body: `createTaskLogsSchema`
  - `taskId: string`
  - `logs: Array<{ status: "success" | "failed" | "loading" | "error"; action: string }>`
- Response: `ApiResponse<createdRecord>` with status `201`

### `DELETE /api/v1/tasks/logs/:id`

- Purpose: delete one task-log record.
- Response: `{ message: "Task logs deleted successfully" }`

### `DELETE /api/v1/tasks/del-all`

- Purpose: clear all task log records.
- Response: `{ message: "All tasks cleared successfully" }`

## Config Endpoints

Mounted from `server/src/feature/config/config.route.ts`.

### `POST /api/v1/configs/`

- Purpose: create config row by `configFor`.
- Body: `createConfigSchema`
- Response: `ApiResponse<Config>`

### `GET /api/v1/configs/:configFor`

- Purpose: fetch config by logical key (for example `udm`).
- Response: `ApiResponse<Config | null>`

### `PATCH /api/v1/configs/:id`

- Purpose: partial update config by ID.
- Body: `updateConfigSchema`
- Response: `ApiResponse<Config>`

### `DELETE /api/v1/configs/:id`

- Purpose: delete config by ID.
- Response: `ApiResponse<null>`

## Automation Log Transport Endpoints

Mounted from `server/src/feature/logs/logs.routes.ts`.

### `GET /api/v1/reporter/runs/:runId/events?cursor=<seq>&limit=<n>`

- Purpose: paginated reporter-event history for terminal UI.
- Query:
  - `cursor` optional numeric sequence cursor
  - `limit` optional numeric page size (default `200`)
- Response: `ApiResponse<{ items: LogEvent[]; nextCursor?: number }>` (repo-driven shape)

### `POST /api/v1/reporter/runs/:runId/events`

- Purpose: ingest one reporter event emitted by automation/server.
- Body: structured `LogEvent` or tolerated raw/legacy-like payload.
- Behavior:
  - validates/parses using logs parser
  - persists to `automation_logs`
  - broadcasts to live WS subscribers
- Response on valid: `ApiResponse<LogEvent>`
- Response on invalid: `ApiResponse<null>` with status `400`

## WebSocket Endpoint

### `GET /ws/reporter/:runId` (WebSocket upgrade)

- Purpose: subscribe to real-time reporter stream for a run.
- Lifecycle:
  - on connect: joins run room and receives latest batch
  - on new log: receives line events
  - on close: disconnects from room

## Source Files

- `server/src/index.ts`
- `server/src/app/router.ts`
- `server/src/feature/automation/automation.route.ts`
- `server/src/feature/runs/runs.route.ts`
- `server/src/feature/task/task.route.ts`
- `server/src/feature/config/config.route.ts`
- `server/src/feature/logs/logs.routes.ts`
