# Architecture And Boundaries

## Layer map

- `automation/`: Playwright jobs, CLI entrypoint, reporter/logger emission.
- `server/`: Hono API, orchestration, log ingestion, DB persistence, WS broadcast.
- `client/`: React UI, stream hook, display mapping, presentational logs components.
- `shared/`: Zod schemas and cross-layer TS types.

## Key references

- `shared/src/schema/logs.schema.ts`
- `shared/src/schema/reporter.schema.ts`
- `automation/src/shared/reporter.ts`
- `automation/src/shared/logger.ts`
- `server/src/feature/logs/logs.routes.ts`
- `server/src/feature/logs/logs.parser.ts`
- `client/src/features/UDMAutomations/hooks/useLogsStream.ts`
- `client/src/features/UDMAutomations/utils/LogsTerminal.mapper.ts`

## Boundary rules

- Keep contracts in `shared/src/schema` and export centrally.
- Keep server routing thin; handlers orchestrate, services/repo own logic.
- Keep client hooks/state separate from presentational components.
- Do not allow client/automation to bypass server APIs for DB writes.
