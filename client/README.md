# Client Workspace

React + Vite frontend for UDM automation workflows.

## Run locally

From repo root:

```bash
bun run dev:client
```

From this workspace:

```bash
bun run dev
```

## Build and lint

From repo root:

```bash
bun run build:client
bun run --cwd client lint
```

From this workspace:

```bash
bun run build
bun run lint
```

## Architecture notes

- Keep data-fetch and state logic in hooks.
- Keep mapping and normalization in pure utilities.
- Keep presentational components focused on rendering.
- Preserve shared contracts from `shared/src/schema`.

## Related docs

- Root onboarding: `../documentation/onboarding.md`
- API reference: `../documentation/api-endpoints.md`
