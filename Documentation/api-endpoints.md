# API Endpoints Reference

This document lists active backend endpoints in `udm-automation` and their purpose.

Base API prefix: `/api/v1`

## Quick Notes

- Most responses follow `ApiResponse<T>`:
  - `message: string`
  - `success: boolean`
  - `data: T`
- Validation is applied with shared Zod schemas on key write endpoints.

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
- Response: `ApiResponse<{ runId: string }>`

### `POST /api/v1/automation/open-multiple`

- Purpose: create multiple tasks and start one shared automation run.
- Body: `createTaskMultipleSchema` (array of task payloads)
- Response: `ApiResponse<{ runId: string }>`

### `POST /api/v1/automation/task`

- Purpose: create a task record only.
- Body: `createTaskSchema`
- Response: `ApiResponse<Task | null>`

### `GET /api/v1/automation/task`

- Purpose: fetch all task records.
- Response: `ApiResponse<Task[]>`

### `GET /api/v1/automation/task/:runId`

- Purpose: fetch a single task by run ID.
- Response on found: `ApiResponse<Task>` with `success: true`
- Response on missing: `ApiResponse<null>` with status `404`

### `GET /api/v1/automation/task-list/:runId`

- Purpose: fetch all tasks linked to a run.
- Response: `ApiResponse<Task[]>`

## Task Endpoints

Mounted from `server/src/feature/task/task.route.ts`.

### `DELETE /api/v1/tasks/del-all`

- Purpose: clear all task records.
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

## Source Files

- `server/src/index.ts`
- `server/src/app/router.ts`
- `server/src/feature/automation/automation.route.ts`
- `server/src/feature/task/task.route.ts`
- `server/src/feature/config/config.route.ts`
