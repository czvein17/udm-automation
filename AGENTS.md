# AGENTS.md

Agent handbook for `udm-automation`.

This file is written for coding agents operating in this repository.
For deeper policy docs, also load `automation-context-factory/AGENTS.md`.

## Repo Snapshot

- Monorepo: Bun workspaces + Turbo.
- Packages: `server`, `client`, `shared`, `automation`.
- Server: Hono + Bun runtime + Drizzle.
- Client: React + Vite + TanStack Router.
- Shared: Zod schemas and shared TS types.
- Automation: Node/Playwright workflow runner.

## Build / Lint / Test Commands

Run from repo root unless noted.

### Install

- `bun install`

### Full Monorepo

- Build all: `bun run build`
- Dev all: `bun run dev`
- Lint all: `bun run lint`
- Type-check all: `bun run type-check`
- Test all: `bun run test`

### Workspace Specific

- Client dev: `bun run dev:client`
- Server dev: `bun run dev:server`
- Client build: `bun run build:client`
- Server build: `bun run build:server`
- Client lint directly: `bun --filter client run lint`
- Shared build directly: `bun --filter shared run build`
- Server build directly: `bun --filter server run build`

### Database (Server)

- Generate migrations: `bun --filter server run db:generate`
- Apply migrations: `bun --filter server run db:migrate`

### Automation Workspace

- Run automation CLI: `bun --filter automation run automate -- <jobId> <runId>`
- Type-check automation: `bun --filter automation run typecheck`
- Alternative from workspace: `npm run typecheck` in `automation/`

## Single Test Guidance (Important)

Current state:

- No test files were found (`*.test.*` / `*.spec.*`).
- No Cursor/Copilot rule files were found (see rules section below).
- Root test command is Turbo-based: `bun run test`.

If a package adds tests, use one of these patterns:

1) Run tests in one workspace:

- `bun turbo test --filter=client`
- `bun turbo test --filter=server`
- `bun turbo test --filter=automation`

2) Run a single test file (framework-dependent):

- Vitest/Jest style: `bun --filter <workspace> run test -- path/to/file.test.ts`
- Bun test style: `bun test path/to/file.test.ts`

3) Run a single test name (framework-dependent):

- `bun --filter <workspace> run test -- -t "test name"`

If a workspace has no `test` script yet, add one in that package first.

## Code Style Guidelines

### Formatting

- Use TypeScript for app code (`.ts` / `.tsx`).
- Use 2-space indentation.
- Use semicolons.
- Prefer double quotes in TS/JS files (matches existing server/shared style).
- Keep functions short and composable.

### Imports

- Order imports by group:
  1) Node built-ins
  2) External packages
  3) Workspace/internal aliases (`@server/*`, `@client/*`, `@shared/*`)
  4) Relative imports
- Use `import type` for type-only imports.
- Prefer shared exports (`shared`) over duplicating local contract types.

### Types And Validation

- Maintain strict typing; avoid `any` unless unavoidable.
- Define cross-layer contracts in `shared/src/schema` using Zod.
- Export shared contracts from `shared/src/schema/index.ts`.
- Validate boundary inputs in server routes/handlers.

### Naming

- `camelCase`: variables, functions, helpers.
- `PascalCase`: React components, types, interfaces.
- `UPPER_SNAKE_CASE`: true constants only.
- Keep filenames aligned with feature responsibility.

### Error Handling

- Fail fast at boundaries with clear messages.
- Do not swallow errors silently.
- Log meaningful context (`runId`, `jobId`, row/task info) on failures.
- Preserve existing `ApiResponse<T>` conventions where used.

### Logging / Reporter Contracts

- Keep log endpoints stable:
  - `POST /api/v1/reporter/runs/:runId/events`
  - `GET /api/v1/reporter/runs/:runId/events`
  - `/ws/reporter/:runId`
- Preserve reporter lifecycle:
  - `run_start -> row_start -> row_step* -> row_end`
- Ensure row grouping remains stable (prefer `taskId`).
- Keep parser logic tolerant of mixed payload quality.

### Client / Server Boundaries

- Keep server routing thin; business logic belongs in services/repo.
- Keep client data-stream logic in hooks and mapping in pure utils.
- Keep presentational components focused on rendering.
- Do not write directly to DB from client or automation.

## Cursor / Copilot Rules Status

Searched and none found:

- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`

If these are later added, treat them as higher-priority agent instructions and update this file.
