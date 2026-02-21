# Verification And Done Definition

## Default verification

From repo root:

- `bun run build`
- `bun run type-check`
- `bun run test`

If automation changed:

- `cd automation && npm run typecheck`

If log flow changed:

1. Start a run.
2. Confirm logs persist via `GET /api/v1/reporter/runs/:runId/events`.
3. Confirm live updates via `/ws/reporter/:runId`.
4. Confirm UI row grouping/issue rendering remains correct.

## Done definition

A task is done only when all are true:

- Shared contracts updated (or confirmed unchanged).
- Touched layers verified by relevant commands/checks.
- No secret leakage or unsafe hardcoding introduced.
- Logs/reporter behavior remains coherent and observable.
- New flow or event behavior is documented in this folder.

## Out of bounds

- Silent contract rewrites between layers.
- One-off scripts that bypass shared schemas.
- Direct DB writes from client/automation outside server APIs.
- Breaking endpoint/path renames without coordinated updates.
