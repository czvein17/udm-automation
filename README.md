# UDM Automation Platform

Internal tool for automating repetitive UDM workflows.

## Why this exists

Manual UDM tasks are repetitive and error-prone at scale. This app helps by:

- Running defined automation workflows from a UI
- Tracking run state for each execution
- Showing progress and failures in the workspace
- Preserving maintainable contracts across server/client/automation/shared

## Current status

- Built and usable for internal workflows
- Main workflow route is automation-first (`/api/v1/automation/*`)
- Legacy observability stack has been removed for a clean rewrite

## Monorepo layout

```text
.
├── automation/                 # Node + Playwright worker/CLI
├── server/                     # Hono API + orchestration + persistence
├── client/                     # React UI
├── shared/                     # Shared Zod schemas and TS types
├── documentation/              # Architecture and API docs
├── automation-context-factory/ # AI-agent rules and engineering guardrails
└── AGENTS.md                   # Agent entry file
```

## Architecture at a glance

### 1) Client (React + Vite)

- Starts automation runs
- Displays workspace and execution history pages

### 2) Server (Hono + Drizzle)

- Accepts automation start requests
- Creates runs/tasks and launches worker jobs
- Persists task/config data

### 3) Automation worker (Node + Playwright)

- Executes workflow steps
- Updates task outcomes through existing APIs

### 4) Shared contracts (Zod + TypeScript)

- Central source of truth for cross-layer payloads
- Keeps server/client/automation aligned

## Canonical API routes

Base prefix: `/api/v1`

- Automation workflow
  - `POST /automation/open`
  - `POST /automation/open-multiple`
  - `POST /automation/task`
  - `GET /automation/task`
  - `GET /automation/task/:runId`
  - `GET /automation/task-list/:runId`
- Task maintenance
  - `DELETE /tasks/del-all`
- Config management
  - `POST /configs/`
  - `GET /configs/:configFor`
  - `PATCH /configs/:id`
  - `DELETE /configs/:id`

## Local development

### Install

```bash
bun install
```

### Run development

```bash
bun run dev
```

Or run services individually:

```bash
bun run dev:server
bun run dev:client
```

### Build and checks

```bash
bun run build
bun run type-check
bun run test
bun run --cwd automation typecheck
```

## Environment notes

- Keep secrets in environment files/variables only
- Do not hardcode credentials or tokens in code

## Documentation

- Docs index: `documentation/README.md`
- Developer onboarding: `documentation/onboarding.md`
- API reference: `documentation/api-endpoints.md`
- Automation terminal architecture: `documentation/automation-terminal-how-it-works.md`

## Handover notes for new maintainers

1. Read `AGENTS.md`
2. Read `automation-context-factory/AGENTS.md`
3. Read `documentation/onboarding.md` then the remaining docs in `documentation/`
4. Run build/type-check commands
5. Start a sample run and verify workflow behavior

## Engineering conventions

- Keep shared contracts in `shared/src/schema`
- Keep server routes thin; put logic in services/repo
- Keep client data/state logic in hooks + pure mappers
- Favor additive schema changes to preserve compatibility
