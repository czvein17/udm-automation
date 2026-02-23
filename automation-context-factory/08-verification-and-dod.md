# Verification And Done Definition

## Default verification

From repo root:

- `bun run build`
- `bun run type-check`
- `bun run test`

If automation changed:

- `cd automation && npm run typecheck`

If run-state flow changed:

1. Start a run.
2. Confirm run creation and status transitions are visible in API responses.
3. Confirm affected UI pages render updated state without runtime errors.

## Done definition

A task is done only when all are true:

- Shared contracts updated (or confirmed unchanged).
- Touched layers verified by relevant commands/checks.
- No secret leakage or unsafe hardcoding introduced.
- Runtime behavior remains coherent and observable.
- New flow behavior is documented in this folder.

## Out of bounds

- Silent contract rewrites between layers.
- One-off scripts that bypass shared schemas.
- Direct DB writes from client/automation outside server APIs.
- Breaking endpoint/path renames without coordinated updates.
