# Architecture And Boundaries

## Layer map

- `automation/`: Playwright jobs and CLI entrypoint.
- `server/`: Hono API, orchestration, and DB persistence.
- `client/`: React UI and workflow pages.
- `shared/`: Zod schemas and cross-layer TS types.

## Key references

- `shared/src/schema/index.ts`
- `server/src/feature/automation/automation.route.ts`
- `server/src/feature/config/config.route.ts`
- `server/src/feature/task/task.route.ts`
- `automation/src/jobs/udm-automation/index.ts`
- `client/src/features/UDMAutomations/pages/Request.tsx`

## Boundary rules

- Keep contracts in `shared/src/schema` and export centrally.
- Keep server routing thin; handlers orchestrate, services/repo own logic.
- Keep client hooks/state separate from presentational components.
- Do not allow client/automation to bypass server APIs for DB writes.
