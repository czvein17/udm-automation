# Engineering Standards

## General

- Keep changes minimal, local, and reversible.
- Prefer explicit names and small modules.
- Avoid broad refactors unless the task requires them.
- Keep TypeScript strictness; avoid `any` unless justified.

## Automation (Node + Playwright)

- Keep entrypoint at `automation/src/cli.ts` and `jobRegistry`-driven jobs.
- Use `createReporter(...)` for row lifecycle.
- Use `makeLogger(...)` for transport and diagnostics.
- Centralize selectors in `automation/src/selectors`.
- Do not swallow errors; log context then rethrow when needed.

## Server (Hono)

- Preserve existing REST + WS contracts.
- Parse and normalize logs in parser modules, not route files.
- Persist first, then broadcast log events.

## Client (React)

- Keep stream logic in hooks (`useLogsStream`) and mapping in pure utils.
- Keep logs UI resilient to partial/missing `meta` and `ctx`.
- Preserve row grouping and issue surfacing behavior.
