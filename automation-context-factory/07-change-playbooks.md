# Change Playbooks

## Add a new shared contract

1. Add schema/type in `shared/src/schema`.
2. Export via `shared/src/schema/index.ts`.
3. Update server/client/automation consumers.
4. Keep old payload handling if compatibility is required.
5. Add or update tests in touched layers.

## Add a new automation action step

1. Add/update action module in `automation/src/actions`.
2. Emit clear, structured status before/after important actions.
3. Keep payloads small and useful.
4. Include row/task context (`taskId`, identifiers) where applicable.

## Change an API payload field

1. Update shared schema first.
2. Keep server handlers backward compatible when needed.
3. Ensure client mappers tolerate old and new shapes.
4. Verify affected REST flows remain consumable.
