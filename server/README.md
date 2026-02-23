# Server Workspace

Hono API server for automation orchestration, config management, and task persistence.

## Run locally

From repo root:

```bash
bun run dev:server
```

From this workspace:

```bash
bun run dev
```

## Build and database commands

From repo root:

```bash
bun run build:server
bun run --cwd server db:generate
bun run --cwd server db:migrate
```

From this workspace:

```bash
bun run build
bun run db:generate
bun run db:migrate
```

## Architecture notes

- Keep route handlers thin; orchestrate through services/repositories.
- Validate request boundaries with shared Zod schemas.
- Preserve API compatibility and `ApiResponse<T>` conventions.
- Keep run-state transitions and failure context explicit.

## Related docs

- Root onboarding: `../documentation/onboarding.md`
- API reference: `../documentation/api-endpoints.md`
