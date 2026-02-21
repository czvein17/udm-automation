# Change Playbooks

## Add a new reporter event

1. Add schema/type in `shared/src/schema/reporter.schema.ts`.
2. Export via `shared/src/schema/index.ts`.
3. Add factory/emission in `automation/src/shared/reporter.ts`.
4. Update server parser normalization.
5. Update client mapper behavior.
6. Add/update parser and mapper tests.

## Add a new automation action step

1. Add/update action module in `automation/src/actions`.
2. Emit `row.step(...)` before/after important actions.
3. Keep `details` payload small and useful.
4. Include row context (`taskId`, identifiers) for stable grouping.

## Change a log payload field

1. Update shared log schema first.
2. Keep server parser backward compatible for existing senders.
3. Ensure mapper tolerates old and new shapes.
4. Verify REST history and WS live payloads remain consumable.
