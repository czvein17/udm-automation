# UDM Automation Platform

Internal tool for automating repetitive UDM workflows.

This project started as a personal productivity tool and is evolving into a team-ready internal web app. It combines a web UI, API, and Playwright worker so automation runs can be triggered, observed, and diagnosed from one place.

## Why this exists

Manual UDM tasks are repetitive, time-consuming, and error-prone when done at scale. This app helps by:

- Running defined automation workflows from a UI
- Tracking each run with structured reporter events
- Showing row-level progress and failures in near real time
- Storing run history for debugging and handoff

## Current status

- Built and usable for internal workflows
- Main workflow route is automation-first (`/api/v1/automation/*`)
- Reporter stream is now event-based (`/api/v1/reporter/...` + `/ws/reporter/...`)
- Designed to be maintainable by other developers if ownership transfers

## Monorepo layout

```text
.
├── automation/                # Node + Playwright worker/CLI
├── server/                    # Hono API + orchestration + persistence
├── client/                    # React UI (run trigger + run visibility)
├── shared/                    # Shared Zod schemas and TS types
├── Documentation/             # Architecture and flow docs
├── automation-context-factory/ # AI-agent rules and engineering guardrails
└── AGENTS.md                  # Agent entry file
```

## Architecture at a glance

### 1) Client (React + Vite)

- Starts automation runs
- Displays event timeline and grouped row progress
- Connects to WebSocket for live updates

### 2) Server (Hono + Drizzle)

- Accepts automation start requests
- Creates runs/tasks and launches worker jobs
- Ingests reporter events
- Persists and broadcasts events to subscribers

### 3) Automation worker (Node + Playwright)

- Executes workflow steps
- Emits structured events (row start/step/end)
- Posts reporter events to API

### 4) Shared contracts (Zod + TypeScript)

- Central source of truth for cross-layer payloads
- Keeps server/client/automation aligned

## Core concepts

- **Run**: One automation execution identified by `runId`
- **Task**: A row/item processed during a run
- **Reporter event**: Structured event emitted during run lifecycle
- **Lifecycle**: `run_start -> row_start -> row_step* -> row_end`

## Canonical API routes

Base prefix: `/api/v1`

- Automation workflow
  - `POST /automation/open`
  - `POST /automation/open-multiple`
- Reporter events
  - `GET /reporter/runs/:runId/events`
  - `POST /reporter/runs/:runId/events`
- Live stream
  - `GET /ws/reporter/:runId` (WebSocket)

Full endpoint reference:

- `Documentation/api-endpoints.md`

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
bun --filter automation run typecheck
```

## Environment notes

- Keep secrets in environment files/variables only
- Do not hardcode credentials or tokens in code
- Required values depend on local auth/runtime setup for automation targets

## Handover notes for new maintainers

If this project changes ownership, start here:

1. Read `AGENTS.md`
2. Read `automation-context-factory/AGENTS.md`
3. Read docs in `Documentation/`
4. Run build/type-check commands
5. Start a sample run and verify reporter history + WS updates

### High-value files to understand first

- `server/src/app/router.ts`
- `server/src/runners/automation.runner.ts`
- `server/src/feature/automation/automation.route.ts`
- `server/src/feature/logs/logs.handler.ts`
- `server/src/feature/logs/logs.ws.ts`
- `automation/src/cli.ts`
- `automation/src/jobs/udm-automation/index.ts`
- `automation/src/shared/reporter.ts`
- `client/src/features/UDMAutomations/hooks/useLogsStream.ts`

## Engineering conventions

- Keep shared contracts in `shared/src/schema`
- Keep server routes thin, put logic in services/repo
- Keep client stream logic in hooks + pure mappers
- Favor additive schema changes to preserve compatibility
- Preserve reporter lifecycle and row grouping stability

For full agent/dev guardrails:

- `automation-context-factory/03-non-negotiable-rules.md`
- `automation-context-factory/05-engineering-standards.md`
- `automation-context-factory/06-scalability-principles.md`

## Troubleshooting quick guide

### Run starts but no live updates

- Check reporter POSTs to `/api/v1/reporter/runs/:runId/events`
- Confirm server is persisting and broadcasting events

### Run exists but UI is empty

- Verify `GET /api/v1/reporter/runs/:runId/events`
- Confirm event payload parsing is valid in server logs parser

### Worker does not execute expected job

- Check `automation/src/cli.ts` job registry
- Confirm `jobId` from server matches the intended worker handler

## Roadmap (internal)

- Harden auth/session management for worker runs
- Improve retry/resume behavior for long runs
- Expand run analytics and failure summaries
- Add more workflow modules beyond current UDM path
- Add automated tests for parser/mapper edge cases

## Final note

This tool was built to reduce repetitive manual effort and make automation behavior visible, debuggable, and transferable across the team. If you are taking this over, you should be able to run, verify, and extend it using this README plus the docs referenced above.
